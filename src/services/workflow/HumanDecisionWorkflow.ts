/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionPriority, DecisionState } from "../../types/ai";
import { EventBus } from "../eventBus";
import { telemetry } from "../observability";
import { EventCategory, EventType } from "../../types/events";
import { mockDb } from "../../repositories/mock";
import { EnhancedRecommendation, RecommendationType } from "../recommendations/types";
import {
  WorkflowDecision,
  WorkflowStatus,
  ReviewerRole,
  ApprovalRuleType,
  ApprovalRuleConfig,
  ApprovalStep,
  WorkflowDecisionExplanation,
  AuditAction,
  WorkflowAuditEntry,
  ConflictType,
  WorkflowConflict,
  ExecutionOutcome,
  OperatorFeedback,
  WorkflowMetrics,
  QueueQueryParams
} from "./types";

/**
 * Enterprise Human Decision Workflow Manager
 * Handles the complete lifecycle of AI-generated and manual operational recommendations,
 * ensuring strict human-in-the-loop oversight, rules enforcement, and audit logs.
 */
export class HumanDecisionWorkflowManager {
  private static instance: HumanDecisionWorkflowManager | null = null;
  private decisions: Map<string, WorkflowDecision> = new Map();
  private eventBusSubIds: string[] = [];

  // Default Approval Rules configured for stadium departments
  private defaultRules: Record<RecommendationType, ApprovalRuleConfig> = {
    [RecommendationType.CROWD]: {
      id: "RULE-CROWD",
      name: "Crowd Ingress Multi-Level Approval",
      type: ApprovalRuleType.MULTI_LEVEL,
      requiredRoles: [ReviewerRole.VOLUNTEER, ReviewerRole.TOC],
      minApprovalsNeeded: 2,
      timeoutMinutes: 10,
      mandatoryAcknowledgement: true,
      bypassOnPriority: [ActionPriority.HIGH]
    },
    [RecommendationType.SECURITY]: {
      id: "RULE-SECURITY",
      name: "Security Commander Sign-off",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.SECURITY],
      minApprovalsNeeded: 1,
      timeoutMinutes: 5,
      mandatoryAcknowledgement: true,
      bypassOnPriority: [ActionPriority.HIGH]
    },
    [RecommendationType.MEDICAL]: {
      id: "RULE-MEDICAL",
      name: "Medical Dispatch Authority",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.MEDICAL],
      minApprovalsNeeded: 1,
      timeoutMinutes: 3,
      mandatoryAcknowledgement: false,
      bypassOnPriority: [ActionPriority.HIGH]
    },
    [RecommendationType.VOLUNTEER]: {
      id: "RULE-VOLUNTEER",
      name: "Volunteer Allocation Approval",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.VOLUNTEER],
      minApprovalsNeeded: 1,
      timeoutMinutes: 15,
      mandatoryAcknowledgement: false,
      bypassOnPriority: []
    },
    [RecommendationType.TRANSPORT]: {
      id: "RULE-TRANSPORT",
      name: "Transport & Transit Transit Coordination",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.TRANSPORT],
      minApprovalsNeeded: 1,
      timeoutMinutes: 15,
      mandatoryAcknowledgement: false,
      bypassOnPriority: [ActionPriority.HIGH]
    },
    [RecommendationType.ACCESSIBILITY]: {
      id: "RULE-ACCESSIBILITY",
      name: "Accessibility Liaison Sign-off",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.ACCESSIBILITY],
      minApprovalsNeeded: 1,
      timeoutMinutes: 20,
      mandatoryAcknowledgement: false,
      bypassOnPriority: []
    },
    [RecommendationType.WEATHER]: {
      id: "RULE-WEATHER",
      name: "Severe Weather Parallel Review",
      type: ApprovalRuleType.PARALLEL,
      requiredRoles: [ReviewerRole.VENUE, ReviewerRole.TOC, ReviewerRole.SECURITY],
      minApprovalsNeeded: 2,
      timeoutMinutes: 8,
      mandatoryAcknowledgement: true,
      bypassOnPriority: [ActionPriority.HIGH]
    },
    [RecommendationType.SUSTAINABILITY]: {
      id: "RULE-SUSTAINABILITY",
      name: "Environmental Standard Operations",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.ENVIRONMENTAL],
      minApprovalsNeeded: 1,
      timeoutMinutes: 30,
      mandatoryAcknowledgement: false,
      bypassOnPriority: []
    },
    [RecommendationType.INFRASTRUCTURE]: {
      id: "RULE-INFRASTRUCTURE",
      name: "Venue Infrastructure Operations",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.VENUE],
      minApprovalsNeeded: 1,
      timeoutMinutes: 20,
      mandatoryAcknowledgement: false,
      bypassOnPriority: []
    },
    [RecommendationType.MATCH_OPERATIONS]: {
      id: "RULE-MATCH",
      name: "Match Director Single Review",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [ReviewerRole.TOC],
      minApprovalsNeeded: 1,
      timeoutMinutes: 12,
      mandatoryAcknowledgement: true,
      bypassOnPriority: [ActionPriority.HIGH]
    }
  };

  private constructor() {
    this.subscribeToEventBus();
    this.syncWithDbRecommendations();
  }

  public static getInstance(): HumanDecisionWorkflowManager {
    if (!HumanDecisionWorkflowManager.instance) {
      HumanDecisionWorkflowManager.instance = new HumanDecisionWorkflowManager();
    }
    return HumanDecisionWorkflowManager.instance;
  }

  /**
   * Resets the workflow manager instance
   */
  public static resetInstance(): void {
    if (HumanDecisionWorkflowManager.instance) {
      HumanDecisionWorkflowManager.instance.unsubscribeFromEventBus();
    }
    HumanDecisionWorkflowManager.instance = null;
  }

  /**
   * Clears all decisions from the memory queue (for test isolation)
   */
  public clear(): void {
    this.decisions.clear();
  }

  /**
   * Warm-up and load existing decisions/recommendations from DB to populate the queue
   */
  public async syncWithDbRecommendations(): Promise<void> {
    try {
      const recommendations = await mockDb.recommendations.getAll();
      for (const rec of recommendations) {
        // Build a workflow decision from the DB recommendation if it does not exist
        if (!this.decisions.has(rec.id)) {
          const enhanced = rec as unknown as EnhancedRecommendation;
          this.ingestRecommendation(enhanced);
        }
      }
    } catch (err) {
      console.error("[HumanDecisionWorkflowManager] Syncing with mock DB failed:", err);
    }
  }

  /**
   * Subscribe to EventBus recommendation generated events
   */
  public subscribeToEventBus(): void {
    if (this.eventBusSubIds.length > 0) return;

    const eventBus = EventBus.getInstance();
    const sub = eventBus.subscribe(EventType.RecommendationGenerated, (event) => {
      const payload = event.payload as any;
      if (payload && payload.recommendation) {
        console.log(`[HumanDecisionWorkflowManager] Ingesting Recommendation ID: ${payload.recommendation.id}`);
        this.ingestRecommendation(payload.recommendation as unknown as EnhancedRecommendation);
      }
    });

    this.eventBusSubIds.push(sub.id);
  }

  /**
   * Unsubscribe from EventBus
   */
  public unsubscribeFromEventBus(): void {
    const eventBus = EventBus.getInstance();
    this.eventBusSubIds.forEach(id => eventBus.unsubscribe(id));
    this.eventBusSubIds = [];
  }

  /**
   * Main Pipeline Step: Converts an AI-Generated recommendation into a human-governed Workflow Decision
   */
  public ingestRecommendation(rec: EnhancedRecommendation): WorkflowDecision {
    const recType = rec.type || RecommendationType.MATCH_OPERATIONS;
    const ruleConfig = this.defaultRules[recType] || this.defaultRules[RecommendationType.MATCH_OPERATIONS];
    
    // Calculate expiration bounds based on the timeout configured
    const now = new Date();
    let expiresAt: string | undefined;
    if (ruleConfig.timeoutMinutes > 0) {
      const expDate = new Date(now.getTime() + ruleConfig.timeoutMinutes * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    // Map base status to Human Decision Workflow status
    let initialStatus = WorkflowStatus.PENDING_REVIEW;
    if (rec.lifecycleStatus) {
      switch (rec.lifecycleStatus as any) {
        case "Draft": initialStatus = WorkflowStatus.PENDING_REVIEW; break;
        case "Pending Review": initialStatus = WorkflowStatus.PENDING_REVIEW; break;
        case "Approved": initialStatus = WorkflowStatus.APPROVED; break;
        case "Rejected": initialStatus = WorkflowStatus.REJECTED; break;
        case "Expired": initialStatus = WorkflowStatus.EXPIRED; break;
        case "Executed": initialStatus = WorkflowStatus.EXECUTED; break;
        case "Cancelled": initialStatus = WorkflowStatus.CANCELLED; break;
        case "Archived": initialStatus = WorkflowStatus.ARCHIVED; break;
        default: initialStatus = WorkflowStatus.PENDING_REVIEW;
      }
    } else if (rec.status === DecisionState.APPROVED) {
      initialStatus = WorkflowStatus.APPROVED;
    } else if (rec.status === DecisionState.REJECTED) {
      initialStatus = WorkflowStatus.REJECTED;
    }

    // Build hierarchical approval steps
    const approvalChain: ApprovalStep[] = ruleConfig.requiredRoles.map((role, idx) => ({
      stepIndex: idx + 1,
      role,
      status: initialStatus === WorkflowStatus.APPROVED ? "APPROVED" : "PENDING"
    }));

    const primaryAssignedRole = ruleConfig.requiredRoles[0] || ReviewerRole.TOC;

    // Create decision explanation block satisfying the rigorous structural objectives
    const explanation: WorkflowDecisionExplanation = {
      aiSummary: rec.explanation?.summary || rec.reason || "Operational tactical guidance formulated against telemetry.",
      reasoning: rec.explanation?.reasoning || rec.reason || "Evaluated by AI runtime using contextual guidelines.",
      supportingEvidence: rec.explanation?.supportingEvidence || rec.evidence || [],
      knowledgeSources: rec.explanation?.knowledgeSourcesUsed || [],
      confidence: rec.confidenceScore || 0.85,
      riskAnalysis: rec.explanation?.potentialRisks || ["Potential resource diversion from non-critical gates."],
      alternativeOptions: rec.explanation?.alternativeOptions || ["Maintain status quo and monitor queue progression."],
      expectedOutcome: rec.explanation?.expectedOutcome || rec.expectedOutcome || "Optimize flow and reduce crowd pressure.",
      estimatedResolutionTime: rec.explanation?.estimatedResolutionTime || 15,
      affectedResources: this.parseAffectedResources(rec.recommendedAction),
      affectedZones: rec.explanation?.affectedAreas || ["General Complex"]
    };

    // Instantiate permanent audit log
    const auditTrail: WorkflowAuditEntry[] = [
      {
        id: `AUD-CR-${Math.random().toString(36).substring(2, 9)}`,
        decisionId: rec.id,
        timestamp: rec.createdAt || now.toISOString(),
        action: AuditAction.CREATED,
        reason: "Operational decision wrapped and placed into the centralized Human Review queue."
      }
    ];

    const decision: WorkflowDecision = {
      id: rec.id,
      recommendationId: rec.id,
      title: rec.title,
      priority: rec.priority || ActionPriority.MEDIUM,
      status: initialStatus,
      assignedRole: primaryAssignedRole,
      assignedReviewerId: rec.operatorId,
      createdAt: rec.createdAt || now.toISOString(),
      updatedAt: rec.createdAt || now.toISOString(),
      expiresAt,
      ruleConfig,
      approvalChain,
      explanation,
      auditTrail,
      conflicts: [],
      acknowledgementSigned: initialStatus === WorkflowStatus.APPROVED ? true : false
    };

    this.decisions.set(decision.id, decision);
    
    // Evaluate conflicts dynamically on initial ingestion
    this.detectConflicts();

    return decision;
  }

  /**
   * Support manually drafting an operational decision bypassing AI triggers
   */
  public createManualDecision(
    title: string,
    priority: ActionPriority,
    role: ReviewerRole,
    actionText: string,
    zone: string,
    creatorId: string
  ): WorkflowDecision {
    const now = new Date();
    const id = `DEC-MAN-${Math.floor(Math.random() * 100000)}`;
    const ruleConfig: ApprovalRuleConfig = {
      id: `RULE-MANUAL-${id}`,
      name: "Manual Operational Action Directive",
      type: ApprovalRuleType.SINGLE_APPROVAL,
      requiredRoles: [role],
      minApprovalsNeeded: 1,
      timeoutMinutes: 30,
      mandatoryAcknowledgement: true,
      bypassOnPriority: []
    };

    const explanation: WorkflowDecisionExplanation = {
      aiSummary: `Manual operational command directive registered by human operator ${creatorId}.`,
      reasoning: "Drafted directly by central command under critical coordination protocol.",
      supportingEvidence: ["Operator direct visual feedback and floor telemetry."],
      knowledgeSources: ["Stadium Manual Chapter 3 - Tactical Dispatch Operations"],
      confidence: 1.0,
      riskAnalysis: ["Minor procedural friction due to rapid operational transition."],
      alternativeOptions: ["Delegate local authority to field stewards."],
      expectedOutcome: "Immediate tactical resolution on the ground.",
      estimatedResolutionTime: 10,
      affectedResources: this.parseAffectedResources(actionText),
      affectedZones: [zone]
    };

    const auditTrail: WorkflowAuditEntry[] = [
      {
        id: `AUD-CR-${Math.random().toString(36).substring(2, 9)}`,
        decisionId: id,
        timestamp: now.toISOString(),
        action: AuditAction.CREATED,
        reviewer: creatorId,
        role,
        reason: "Manual operational action directive created directly."
      }
    ];

    const decision: WorkflowDecision = {
      id,
      recommendationId: id,
      title,
      priority,
      status: WorkflowStatus.PENDING_REVIEW,
      assignedRole: role,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      ruleConfig,
      approvalChain: [{ stepIndex: 1, role, status: "PENDING" }],
      explanation,
      auditTrail,
      conflicts: []
    };

    this.decisions.set(id, decision);
    this.detectConflicts();

    return decision;
  }

  /**
   * Log that a decision has been examined by an operator
   */
  public viewDecision(id: string, reviewerId: string, role?: ReviewerRole): void {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    const alreadyLoggedView = decision.auditTrail.some(
      entry => entry.action === AuditAction.VIEWED && entry.reviewer === reviewerId
    );

    if (!alreadyLoggedView) {
      decision.auditTrail.push({
        id: `AUD-VW-${Math.random().toString(36).substring(2, 9)}`,
        decisionId: decision.id,
        timestamp: now,
        action: AuditAction.VIEWED,
        reviewer: reviewerId,
        role,
        reason: `Decision was viewed and inspected in the human coordination queue.`
      });
      decision.updatedAt = now;
    }
  }

  /**
   * Support assigning recommendations to an accountable reviewer role and specific ID
   */
  public assignDecision(id: string, role: ReviewerRole, reviewerId: string, assignerId: string): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.assignedRole = role;
    decision.assignedReviewerId = reviewerId;
    decision.status = WorkflowStatus.ASSIGNED_REVIEWER;
    decision.updatedAt = now;

    decision.auditTrail.push({
      id: `AUD-AS-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.ASSIGNED,
      reviewer: assignerId,
      reason: `Assigned decision responsibility to ${role} (Assigned Operator ID: ${reviewerId})`
    });

    // Update corresponding step in approval chain if matched
    const step = decision.approvalChain.find(s => s.role === role);
    if (step) {
      step.approverId = reviewerId;
    }

    this.detectConflicts();
    return decision;
  }

  /**
   * Approve a decision through hierarchical rules validation
   */
  public async approveDecision(
    id: string,
    reviewerId: string,
    role: ReviewerRole,
    notes?: string,
    signedChecklist?: boolean
  ): Promise<WorkflowDecision> {
    const decision = this.getRequiredDecision(id);
    const now = new Date();

    // 1. Strict Expiration check
    if (this.isExpired(decision)) {
      decision.status = WorkflowStatus.EXPIRED;
      decision.auditTrail.push({
        id: `AUD-EX-${Math.random().toString(36).substring(2, 9)}`,
        decisionId: decision.id,
        timestamp: now.toISOString(),
        action: AuditAction.EXPIRED,
        reason: "Attempted to approve an expired recommendation."
      });
      this.detectConflicts();
      throw new Error(`Decision is expired and cannot be approved.`);
    }

    // 2. Acknowledgement check
    if (decision.ruleConfig.mandatoryAcknowledgement && !signedChecklist) {
      throw new Error(`Mandatory operational check signature acknowledgement required to approve.`);
    }

    decision.acknowledgementSigned = signedChecklist;

    // 3. Update the step status
    const currentStep = decision.approvalChain.find(step => step.role === role && step.status === "PENDING");
    if (currentStep) {
      currentStep.status = "APPROVED";
      currentStep.approverId = reviewerId;
      currentStep.timestamp = now.toISOString();
      currentStep.notes = notes;
    }

    // 4. Record Audit Log
    decision.auditTrail.push({
      id: `AUD-AP-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now.toISOString(),
      action: AuditAction.APPROVED,
      reviewer: reviewerId,
      role,
      reason: notes || "Approved standard protocol directive.",
      payload: { signedChecklist }
    });

    // 5. Evaluate Rules Engine for final approval transition
    const priorityIsEmergency = decision.ruleConfig.bypassOnPriority.includes(decision.priority);
    const totalApprovedSteps = decision.approvalChain.filter(s => s.status === "APPROVED").length;

    let finalApprovalGranted = false;

    if (decision.ruleConfig.type === ApprovalRuleType.EMERGENCY_FAST_TRACK || priorityIsEmergency) {
      // Emergency fast-track triggers immediate overall approval on first signature
      finalApprovalGranted = true;
    } else if (decision.ruleConfig.type === ApprovalRuleType.SINGLE_APPROVAL) {
      finalApprovalGranted = true;
    } else if (decision.ruleConfig.type === ApprovalRuleType.MULTI_LEVEL) {
      // Must be completely sequential, check if all steps approved
      finalApprovalGranted = totalApprovedSteps === decision.approvalChain.length;
    } else if (decision.ruleConfig.type === ApprovalRuleType.PARALLEL) {
      // Needs minimum required subset approved
      finalApprovalGranted = totalApprovedSteps >= decision.ruleConfig.minApprovalsNeeded;
    }

    if (finalApprovalGranted) {
      decision.status = WorkflowStatus.APPROVED;
      decision.updatedAt = now.toISOString();

      telemetry.reportComponentStatus("WorkflowEngine", "OK", 5, "Workflow decision final approval granted.");
      telemetry.log("INFO", `Workflow decision approved: ${decision.id}`, {
        priority: decision.priority,
        ruleType: decision.ruleConfig.type,
      });

      // Mirror state with MockDB
      await this.safeUpdateDbRecommendation(decision.id, DecisionState.APPROVED, reviewerId, now.toISOString());

      // Trigger standard operational events on the EventBus for downstream action dispatchers
      EventBus.getInstance().publish(
        EventType.RecommendationApproved,
        EventCategory.OPERATIONAL,
        { recommendationId: decision.id, approvedAt: now.toISOString() },
        reviewerId
      );
    }

    this.detectConflicts();
    return decision;
  }

  /**
   * Reject a decision, logging reason and audit log
   */
  public async rejectDecision(
    id: string,
    reviewerId: string,
    role: ReviewerRole,
    reason: string
  ): Promise<WorkflowDecision> {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.status = WorkflowStatus.REJECTED;
    decision.updatedAt = now;

    // Fail all pending steps in the chain
    decision.approvalChain.forEach(step => {
      if (step.status === "PENDING") {
        step.status = "REJECTED";
        step.approverId = reviewerId;
        step.timestamp = now;
      }
    });

    decision.auditTrail.push({
      id: `AUD-RJ-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.REJECTED,
      reviewer: reviewerId,
      role,
      reason: `Rejected by commander. Reason: ${reason}`
    });

    await this.safeUpdateDbRecommendation(decision.id, DecisionState.REJECTED, reviewerId, now);

    EventBus.getInstance().publish(
      EventType.RecommendationRejected,
      EventCategory.OPERATIONAL,
      { recommendationId: decision.id, rejectedAt: now, reason },
      reviewerId
    );

    this.detectConflicts();
    return decision;
  }

  /**
   * Request operational revision or tactical modification
   */
  public requestRevision(id: string, reviewerId: string, role: ReviewerRole, notes: string): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.status = WorkflowStatus.NEEDS_REVISION;
    decision.updatedAt = now;

    // Reset approval chain back to pending for re-review
    decision.approvalChain.forEach(step => {
      step.status = "PENDING";
    });

    decision.auditTrail.push({
      id: `AUD-MOD-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.MODIFIED,
      reviewer: reviewerId,
      role,
      reason: `Needs Revision: ${notes}`
    });

    this.detectConflicts();
    return decision;
  }

  /**
   * Escalate decision up the chain of authority
   */
  public escalateDecision(id: string, reviewerId: string, role: ReviewerRole, notes: string): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.status = WorkflowStatus.ESCALATED;
    decision.priority = ActionPriority.HIGH;
    decision.assignedRole = ReviewerRole.TOC; // Escalations always funnel to Tournament Operations Center
    decision.updatedAt = now;

    decision.auditTrail.push({
      id: `AUD-ES-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.ASSIGNED, // log assignment update
      reviewer: reviewerId,
      role,
      reason: `Escalation requested. Funneled directly to Tournament Operations Center. Notes: ${notes}`
    });

    this.detectConflicts();
    return decision;
  }

  /**
   * Complete the workflow execution lifecycle
   */
  public executeDecision(id: string, operatorId: string): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    if (decision.status !== WorkflowStatus.APPROVED) {
      throw new Error(`Decision must be APPROVED before execution on stadium floor.`);
    }

    decision.status = WorkflowStatus.EXECUTED;
    decision.updatedAt = now;

    decision.auditTrail.push({
      id: `AUD-EX-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.EXECUTED,
      reviewer: operatorId,
      reason: `Tactical on-the-ground execution completed by field operations crew.`
    });

    this.detectConflicts();
    return decision;
  }

  /**
   * Support collecting structured feedback and learning signals
   */
  public submitFeedback(id: string, feedback: OperatorFeedback): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.feedback = feedback;
    decision.updatedAt = now;

    decision.auditTrail.push({
      id: `AUD-FB-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.MODIFIED,
      reviewer: feedback.operatorId,
      reason: `Post-execution feedback submitted. Outcome: ${feedback.outcome}.`
    });

    this.detectConflicts();
    return decision;
  }

  /**
   * Archive decision to clean up active decision spaces
   */
  public archiveDecision(id: string, operatorId: string): WorkflowDecision {
    const decision = this.getRequiredDecision(id);
    const now = new Date().toISOString();

    decision.status = WorkflowStatus.ARCHIVED;
    decision.updatedAt = now;

    decision.auditTrail.push({
      id: `AUD-AR-${Math.random().toString(36).substring(2, 9)}`,
      decisionId: decision.id,
      timestamp: now,
      action: AuditAction.CANCELLED, // category map
      reviewer: operatorId,
      reason: `Archived decision record.`
    });

    return decision;
  }

  /**
   * Query operation support: Filtering, Searching, Ordering and Grouping
   */
  public getQueue(params: QueueQueryParams): WorkflowDecision[] {
    // Proactively scan expirations before serving the queue
    this.checkExpirations();

    let list = Array.from(this.decisions.values());

    // 1. Text Search query in Title, reasoning, summary or affected area
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.explanation.aiSummary.toLowerCase().includes(q) ||
        d.explanation.reasoning.toLowerCase().includes(q) ||
        d.explanation.affectedZones.some(zone => zone.toLowerCase().includes(q))
      );
    }

    // 2. Filter by status
    if (params.filterByStatus && params.filterByStatus.length > 0) {
      list = list.filter(d => params.filterByStatus!.includes(d.status));
    }

    // 3. Filter by role
    if (params.filterByRole && params.filterByRole.length > 0) {
      list = list.filter(d => d.assignedRole && params.filterByRole!.includes(d.assignedRole));
    }

    // 4. Sort Queue
    const sortBy = params.sortBy || "createdAt";
    const order = params.sortOrder || "desc";

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof WorkflowDecision] || "";
      let valB: any = b[sortBy as keyof WorkflowDecision] || "";

      if (sortBy === "priority") {
        const orderMap = {
          [ActionPriority.HIGH]: 4,
          [ActionPriority.MEDIUM]: 3,
          [ActionPriority.LOW]: 2
        };
        valA = orderMap[a.priority] || 0;
        valB = orderMap[b.priority] || 0;
      } else if (sortBy === "confidence") {
        valA = a.explanation.confidence;
        valB = b.explanation.confidence;
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }

  /**
   * Group decisions based on active properties
   */
  public getGroupedQueue(groupBy: "status" | "role" | "priority", params: QueueQueryParams = {}): Record<string, WorkflowDecision[]> {
    const list = this.getQueue(params);
    const groups: Record<string, WorkflowDecision[]> = {};

    for (const dec of list) {
      let key = "";
      if (groupBy === "status") {
        key = dec.status;
      } else if (groupBy === "role") {
        key = dec.assignedRole || "Unassigned";
      } else if (groupBy === "priority") {
        key = dec.priority;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(dec);
    }

    return groups;
  }

  /**
   * Dynamic check and update of time-based expirations
   */
  public checkExpirations(): void {
    const now = new Date();
    for (const [id, dec] of this.decisions.entries()) {
      if (
        (dec.status === WorkflowStatus.PENDING_REVIEW || dec.status === WorkflowStatus.ASSIGNED_REVIEWER) &&
        dec.expiresAt &&
        new Date(dec.expiresAt) < now
      ) {
        dec.status = WorkflowStatus.EXPIRED;
        dec.updatedAt = now.toISOString();
        dec.auditTrail.push({
          id: `AUD-EX-${Math.random().toString(36).substring(2, 9)}`,
          decisionId: dec.id,
          timestamp: now.toISOString(),
          action: AuditAction.EXPIRED,
          reason: `Automatic expiration triggered due to exceeding the timeout limit (${dec.ruleConfig.timeoutMinutes} mins)`
        });

        // Fail all pending steps
        dec.approvalChain.forEach(step => {
          if (step.status === "PENDING") step.status = "REJECTED";
        });
      }
    }
  }

  /**
   * Multi-variable conflict detection and warning indicators
   */
  public detectConflicts(): void {
    const activeDecisions = Array.from(this.decisions.values()).filter(d =>
      d.status !== WorkflowStatus.EXECUTED &&
      d.status !== WorkflowStatus.REJECTED &&
      d.status !== WorkflowStatus.EXPIRED &&
      d.status !== WorkflowStatus.ARCHIVED &&
      d.status !== WorkflowStatus.CANCELLED
    );

    // Reset conflicts array first
    for (const d of this.decisions.values()) {
      d.conflicts = [];
    }

    for (const decA of activeDecisions) {
      for (const decB of activeDecisions) {
        if (decA.id === decB.id) continue;

        // 1. Conflicting Approvals: two approved actions in overlapping zones that are not duplicates
        if (
          decA.status === WorkflowStatus.APPROVED &&
          decB.status === WorkflowStatus.APPROVED &&
          this.haveOverlappingZones(decA, decB) &&
          this.computeCosineSimilarity(decA.title, decB.title) < 0.8
        ) {
          const conflict: WorkflowConflict = {
            id: `CONF-APP-${decA.id}-${decB.id}`,
            type: ConflictType.CONFLICTING_APPROVALS,
            decisionIds: [decA.id, decB.id],
            severity: "CRITICAL",
            description: `Two conflicting approved directives are active in overlapping zones (${decA.explanation.affectedZones.join(",")}): "${decA.title}" vs "${decB.title}"`,
            resolutionAction: "Review and suspend one directive before field dispatchers duplicate resources."
          };
          decA.conflicts.push(conflict);
        }

        // 2. Duplicate decisions: multiple identical/highly similar recommendations active in same sector
        if (
          this.haveOverlappingZones(decA, decB) &&
          this.computeCosineSimilarity(decA.title, decB.title) > 0.8 &&
          (decA.status === WorkflowStatus.PENDING_REVIEW || decA.status === WorkflowStatus.ASSIGNED_REVIEWER)
        ) {
          const conflict: WorkflowConflict = {
            id: `CONF-DUP-${decA.id}-${decB.id}`,
            type: ConflictType.DUPLICATE_DECISIONS,
            decisionIds: [decA.id, decB.id],
            severity: "LOW",
            description: `Highly similar redundant recommendation detected: "${decA.title}" mirrors active task "${decB.title}"`,
            resolutionAction: "Archive or reject the newer recommendation as duplicate to keep queue clean."
          };
          decA.conflicts.push(conflict);
        }

        // 3. Resource conflicts: same physical resources allocated to overlapping active decisions
        const sharedResources = decA.explanation.affectedResources.filter(r =>
          decB.explanation.affectedResources.includes(r)
        );
        if (sharedResources.length > 0) {
          const conflict: WorkflowConflict = {
            id: `CONF-RES-${decA.id}-${decB.id}`,
            type: ConflictType.RESOURCE_CONFLICTS,
            decisionIds: [decA.id, decB.id],
            severity: "HIGH",
            description: `Resource double-allocation hazard! Both decisions deploy: [${sharedResources.join(", ")}]`,
            resolutionAction: "Re-route alternative tactical groups, or sequence task timeline."
          };
          decA.conflicts.push(conflict);
        }

        // 4. Priority Inversions: lower priority task approved/assigned before a critical priority task in same zone/department
        if (
          this.priorityValue(decA.priority) < this.priorityValue(decB.priority) &&
          this.haveOverlappingZones(decA, decB) &&
          decA.status === WorkflowStatus.APPROVED &&
          (decB.status === WorkflowStatus.PENDING_REVIEW || decB.status === WorkflowStatus.ASSIGNED_REVIEWER)
        ) {
          const conflict: WorkflowConflict = {
            id: `CONF-INV-${decA.id}-${decB.id}`,
            type: ConflictType.PRIORITY_INVERSIONS,
            decisionIds: [decA.id, decB.id],
            severity: "MEDIUM",
            description: `Priority Inversion detected. Lower priority action "${decA.title}" is approved while high-priority task "${decB.title}" remains pending in the same sector.`,
            resolutionAction: "Review and prioritize the high-priority task."
          };
          decA.conflicts.push(conflict);
        }
      }
    }
  }

  /**
   * Complete operational metrics tracking
   */
  public getMetrics(): WorkflowMetrics {
    const total = this.decisions.size;
    const list = Array.from(this.decisions.values());

    const reviewed = list.filter(d =>
      d.status !== WorkflowStatus.PENDING_REVIEW &&
      d.status !== WorkflowStatus.ASSIGNED_REVIEWER
    );

    const approved = reviewed.filter(d =>
      d.status === WorkflowStatus.APPROVED ||
      d.status === WorkflowStatus.EXECUTED
    ).length;

    const rejected = reviewed.filter(d => d.status === WorkflowStatus.REJECTED).length;
    const overridden = reviewed.filter(d => d.status === WorkflowStatus.NEEDS_REVISION).length;

    const approvalRate = reviewed.length > 0 ? parseFloat((approved / reviewed.length).toFixed(3)) : 0;
    const rejectedRate = reviewed.length > 0 ? parseFloat((rejected / reviewed.length).toFixed(3)) : 0;
    const overrideRate = reviewed.length > 0 ? parseFloat((overridden / reviewed.length).toFixed(3)) : 0;

    // Calculate Average Review Time (Creation -> Approval/Rejection in minutes)
    let reviewTimeSum = 0;
    let reviewTimeCount = 0;
    let escalatedCount = 0;

    // Calculate Execution Success
    const executed = list.filter(d => d.status === WorkflowStatus.EXECUTED);
    const successfulExecutions = executed.filter(d =>
      d.feedback?.outcome === ExecutionOutcome.SUCCESSFUL ||
      d.feedback?.outcome === ExecutionOutcome.PARTIALLY_SUCCESSFUL
    ).length;

    const executionSuccessRate = executed.length > 0 ? parseFloat((successfulExecutions / executed.length).toFixed(3)) : 0;

    let resolutionTimeSum = 0;
    let resolutionTimeCount = 0;

    const workload: Record<ReviewerRole, number> = {
      [ReviewerRole.TOC]: 0,
      [ReviewerRole.SECURITY]: 0,
      [ReviewerRole.MEDICAL]: 0,
      [ReviewerRole.VOLUNTEER]: 0,
      [ReviewerRole.TRANSPORT]: 0,
      [ReviewerRole.VENUE]: 0,
      [ReviewerRole.ACCESSIBILITY]: 0,
      [ReviewerRole.ENVIRONMENTAL]: 0
    };

    for (const d of list) {
      // Reviewer Workload active counts (pending or assigned)
      if (
        (d.status === WorkflowStatus.PENDING_REVIEW || d.status === WorkflowStatus.ASSIGNED_REVIEWER) &&
        d.assignedRole
      ) {
        workload[d.assignedRole] = (workload[d.assignedRole] || 0) + 1;
      }

      // Check for escalation logging
      const hasEscalated = d.auditTrail.some(a => a.reason && a.reason.includes("Escalation"));
      if (hasEscalated || d.status === WorkflowStatus.ESCALATED) {
        escalatedCount++;
      }

      // Time parsing
      const createdTime = new Date(d.createdAt).getTime();

      // Find first approval or rejection timestamp
      const finalAudit = d.auditTrail.find(a =>
        a.action === AuditAction.APPROVED || a.action === AuditAction.REJECTED
      );

      if (finalAudit) {
        const reviewTime = new Date(finalAudit.timestamp).getTime() - createdTime;
        reviewTimeSum += Math.max(0, reviewTime);
        reviewTimeCount++;
      }

      // Find execution resolved timestamp
      const execAudit = d.auditTrail.find(a => a.action === AuditAction.EXECUTED);
      if (execAudit) {
        const resTime = new Date(execAudit.timestamp).getTime() - createdTime;
        resolutionTimeSum += Math.max(0, resTime);
        resolutionTimeCount++;
      }
    }

    const averageReviewTimeMinutes = reviewTimeCount > 0
      ? parseFloat((reviewTimeSum / (1000 * 60 * reviewTimeCount)).toFixed(2))
      : 0;

    const averageResolutionTimeMinutes = resolutionTimeCount > 0
      ? parseFloat((resolutionTimeSum / (1000 * 60 * resolutionTimeCount)).toFixed(2))
      : 0;

    const escalationRate = reviewed.length > 0 ? parseFloat((escalatedCount / reviewed.length).toFixed(3)) : 0;

    return {
      approvalRate,
      averageReviewTimeMinutes,
      escalationRate,
      executionSuccessRate,
      overrideRate,
      rejectedRecommendationRate: rejectedRate,
      averageResolutionTimeMinutes,
      reviewerWorkload: workload
    };
  }

  // --- PRIVATE UTILITY HELPERS ---

  private getRequiredDecision(id: string): WorkflowDecision {
    const decision = this.decisions.get(id);
    if (!decision) {
      throw new Error(`Workflow Decision not found for ID: ${id}`);
    }
    return decision;
  }

  private isExpired(dec: WorkflowDecision): boolean {
    if (!dec.expiresAt) return false;
    return new Date(dec.expiresAt) < new Date();
  }

  private haveOverlappingZones(a: WorkflowDecision, b: WorkflowDecision): boolean {
    return a.explanation.affectedZones.some(zone =>
      b.explanation.affectedZones.some(otherZone =>
        otherZone.toLowerCase().trim() === zone.toLowerCase().trim()
      )
    );
  }

  private priorityValue(priority: ActionPriority): number {
    switch (priority) {
      case ActionPriority.HIGH: return 3;
      case ActionPriority.MEDIUM: return 2;
      case ActionPriority.LOW: return 1;
      default: return 2;
    }
  }

  private parseAffectedResources(actionText: string): string[] {
    const resources: string[] = [];
    const regex = /(medical\s*team|volunteer|security\s*unit|shuttle|steward|scanners|gates|police|staff)\s*([a-zA-Z0-9_-]+|[1-9])/gi;
    let match;
    while ((match = regex.exec(actionText)) !== null) {
      resources.push(match[0].toLowerCase().trim());
    }
    if (resources.length === 0) {
      resources.push("general duty staff");
    }
    return Array.from(new Set(resources));
  }

  private computeCosineSimilarity(s1: string, s2: string): number {
    const words1 = s1.toLowerCase().split(/\s+/);
    const words2 = s2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = words1.filter(w => set2.has(w));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.length / Math.sqrt(words1.length * words2.length);
  }

  private async safeUpdateDbRecommendation(id: string, status: DecisionState, operatorId?: string, resolvedAt?: string): Promise<void> {
    try {
      const existing = await mockDb.recommendations.getById(id);
      if (existing) {
        await mockDb.recommendations.update(id, {
          status,
          operatorId,
          resolvedAt
        } as any);
      } else {
        const dec = this.decisions.get(id);
        if (dec) {
          await mockDb.recommendations.create({
            id: dec.id,
            title: dec.title,
            reason: dec.explanation.aiSummary,
            evidence: dec.explanation.supportingEvidence,
            recommendedAction: dec.explanation.aiSummary,
            expectedOutcome: dec.explanation.expectedOutcome,
            confidenceScore: dec.explanation.confidence,
            priority: dec.priority,
            status,
            operatorId,
            createdAt: dec.createdAt,
            resolvedAt
          });
        }
      }
    } catch (err) {
      console.warn(`[HumanDecisionWorkflowManager] DB Sync warning for ID ${id}:`, err);
    }
  }
}
