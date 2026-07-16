/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionPriority, DecisionState } from "../../../types/ai";
import { HumanDecisionWorkflowManager } from "../HumanDecisionWorkflow";
import { mockDb } from "../../../repositories/mock";
import { EnhancedRecommendation, RecommendationType, RecommendationStatus } from "../../recommendations/types";
import {
  WorkflowStatus,
  ReviewerRole,
  ApprovalRuleType,
  AuditAction,
  ConflictType,
  ExecutionOutcome,
  QueueQueryParams
} from "../types";

async function runWorkflowTests() {
  console.log("=== STARTING HUMAN DECISION WORKFLOW TESTS ===");
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  }

  const manager = HumanDecisionWorkflowManager.getInstance();

  // Helper mock recommendation builder
  function createMockEnhancedRecommendation(id: string, type: RecommendationType, priority: ActionPriority, title: string): EnhancedRecommendation {
    return {
      id,
      title,
      reason: `Mock reasoning for ${id}`,
      evidence: ["Observation 1", "Observation 2"],
      recommendedAction: `Deploy volunteer crew 1 and security unit A to sector B`,
      expectedOutcome: "Slight wait time reduction",
      confidenceScore: 0.88,
      priority,
      status: DecisionState.PENDING,
      createdAt: new Date().toISOString(),
      type,
      lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
      explanation: {
        summary: `Summary of ${id}`,
        reasoning: `Detailed reasoning of ${id}`,
        supportingEvidence: ["Observation 1"],
        knowledgeSourcesUsed: ["SOP-123"],
        confidence: 0.88,
        expectedOutcome: "Slight wait time reduction",
        potentialRisks: ["Minor friction"],
        alternativeOptions: ["Do nothing"],
        estimatedResolutionTime: 12,
        affectedAreas: ["East Entrance Concourse"]
      },
      ranking: {
        priority: 7,
        confidence: 0.88,
        operationalImpact: 6,
        timeSensitivity: 5,
        resourceCost: 4,
        riskReduction: 6,
        overallScore: 78
      },
      conflicts: [],
      auditTrail: []
    };
  }

  // --- TEST 1: Recommendation Ingestion & Centralized Queue ---
  await test("Queue Ingestion - Converts recommendation to decision workflow and validates fields", async () => {
    const rec = createMockEnhancedRecommendation("REC-TEST-1", RecommendationType.CROWD, ActionPriority.MEDIUM, "Pacing scan lines");
    const dec = manager.ingestRecommendation(rec);

    if (dec.id !== "REC-TEST-1") throw new Error("ID mismatch");
    if (dec.status !== WorkflowStatus.PENDING_REVIEW) throw new Error("Status should be PENDING_REVIEW");
    if (dec.assignedRole !== ReviewerRole.VOLUNTEER) throw new Error("Default crowd role should be Volunteer");
    if (dec.explanation.confidence !== 0.88) throw new Error("Confidence score not matched");
    if (dec.auditTrail.length !== 1 || dec.auditTrail[0].action !== AuditAction.CREATED) {
      throw new Error("Audit log should contain a CREATE action");
    }
  });

  // --- TEST 2: Sorting, Searching, Filtering and Grouping ---
  await test("Queue Queries - Handles complex sorting, filtering, searching and grouping", async () => {
    // Clear manager and insert customized entries
    HumanDecisionWorkflowManager.resetInstance();
    const qManager = HumanDecisionWorkflowManager.getInstance();

    const rec1 = createMockEnhancedRecommendation("REC-S1", RecommendationType.SECURITY, ActionPriority.HIGH, "Emergency VIP Protection");
    const rec2 = createMockEnhancedRecommendation("REC-S2", RecommendationType.CROWD, ActionPriority.LOW, "Pacing line flow");
    const rec3 = createMockEnhancedRecommendation("REC-S3", RecommendationType.MEDICAL, ActionPriority.MEDIUM, "Heat fatigue hydration dispatch");

    qManager.ingestRecommendation(rec1);
    qManager.ingestRecommendation(rec2);
    qManager.ingestRecommendation(rec3);

    // Search query
    const searchResult = qManager.getQueue({ searchQuery: "fatigue" });
    if (searchResult.length !== 1 || searchResult[0].id !== "REC-S3") {
      throw new Error(`Searching should return exactly REC-S3, returned: ${searchResult.length}`);
    }

    // Sorting by priority (High, Medium, Low)
    const sortedResult = qManager.getQueue({ sortBy: "priority", sortOrder: "desc" });
    if (sortedResult[0].id !== "REC-S1" || sortedResult[2].id !== "REC-S2") {
      throw new Error("Sorting by priority desc is incorrect");
    }

    // Filtering by assigned role
    const filteredResult = qManager.getQueue({ filterByRole: [ReviewerRole.SECURITY] });
    if (filteredResult.length !== 1 || filteredResult[0].id !== "REC-S1") {
      throw new Error("Filtering by assigned role Security Commander failed");
    }

    // Grouping by priority
    const grouped = qManager.getGroupedQueue("priority");
    if (grouped[ActionPriority.HIGH].length !== 1 || grouped[ActionPriority.LOW].length !== 1) {
      throw new Error("Grouping by priority failed");
    }
  });

  // --- TEST 3: Reviewer Assignment ---
  await test("Assignment Workflow - Manages assigning decisions to roles and specific operators", async () => {
    const rManager = HumanDecisionWorkflowManager.getInstance();
    const rec = createMockEnhancedRecommendation("REC-A1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy extra bag check lane");
    const dec = rManager.ingestRecommendation(rec);

    rManager.assignDecision(dec.id, ReviewerRole.SECURITY, "commander_john", "admin_lucas");

    if (dec.assignedRole !== ReviewerRole.SECURITY) throw new Error("Role assignment failed");
    if (dec.assignedReviewerId !== "commander_john") throw new Error("Reviewer ID assignment failed");
    if (dec.status !== WorkflowStatus.ASSIGNED_REVIEWER) throw new Error("Workflow status should be ASSIGNED_REVIEWER");

    // Check last audit trail entry is ASSIGNED
    const latestAudit = dec.auditTrail[dec.auditTrail.length - 1];
    if (latestAudit.action !== AuditAction.ASSIGNED || latestAudit.reviewer !== "admin_lucas") {
      throw new Error("Assignment audit logging failed");
    }
  });

  // --- TEST 4: Approval Rules Engine ---
  await test("Approval Rules - Checks single, multi-level, parallel and emergency rules", async () => {
    const aManager = HumanDecisionWorkflowManager.getInstance();
    
    // 4.1 Single Approval validation with mandatory check sign-off
    const rec1 = createMockEnhancedRecommendation("REC-RULE-1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "CCTV Scan Sector East");
    const dec1 = aManager.ingestRecommendation(rec1);

    // Try to approve without signature check (should fail)
    try {
      await aManager.approveDecision(dec1.id, "john_123", ReviewerRole.SECURITY, "Looks correct", false);
      throw new Error("Should have thrown error due to missing mandatory acknowledgement signature");
    } catch (e: any) {
      if (!e.message.includes("Mandatory operational check signature")) throw e;
    }

    // Approve with checklist signed (should succeed)
    await aManager.approveDecision(dec1.id, "john_123", ReviewerRole.SECURITY, "Looks correct", true);
    if (dec1.status !== WorkflowStatus.APPROVED) {
      throw new Error(`Single approval should set status to APPROVED, got: ${dec1.status}`);
    }

    // 4.2 Multi-Level sequence validation
    const rec2 = createMockEnhancedRecommendation("REC-RULE-2", RecommendationType.CROWD, ActionPriority.MEDIUM, "Gate A re-routing");
    const dec2 = aManager.ingestRecommendation(rec2);

    // Default rule configuration for crowd is multi-level requiring Volunteer and TOC
    // First step approval (Volunteer)
    await aManager.approveDecision(dec2.id, "v_coord", ReviewerRole.VOLUNTEER, "Approved step 1", true);
    if (dec2.status === WorkflowStatus.APPROVED) {
      throw new Error("Decision should not be approved yet; TOC sign-off is pending");
    }

    // Second step approval (TOC)
    await aManager.approveDecision(dec2.id, "toc_operator", ReviewerRole.TOC, "Approved step 2", true);
    if ((dec2 as any).status !== WorkflowStatus.APPROVED) {
      throw new Error("Multi-level decision should be completely APPROVED after final step");
    }

    // 4.3 Emergency Fast-track
    const rec3 = createMockEnhancedRecommendation("REC-RULE-3", RecommendationType.CROWD, ActionPriority.HIGH, "Emergency evac simulation");
    const dec3 = aManager.ingestRecommendation(rec3);

    // In Crowd, bypassOnPriority includes HIGH. Thus first sign-off by any of the required roles immediately fast-tracks approval
    await aManager.approveDecision(dec3.id, "toc_op", ReviewerRole.TOC, "Emergency bypass", true);
    if (dec3.status !== WorkflowStatus.APPROVED) {
      throw new Error("Emergency fast-track bypass failed");
    }
  });

  // --- TEST 5: Time-Based Expirations ---
  await test("Expirations - Expires inactive decisions automatically", async () => {
    const eManager = HumanDecisionWorkflowManager.getInstance();
    const rec = createMockEnhancedRecommendation("REC-EXP-1", RecommendationType.MEDICAL, ActionPriority.MEDIUM, "Medical response team B");
    const dec = eManager.ingestRecommendation(rec);

    // Mock expiration by setting expiresAt to the past
    dec.expiresAt = new Date(Date.now() - 5000).toISOString();

    eManager.checkExpirations();

    if (dec.status !== WorkflowStatus.EXPIRED) {
      throw new Error(`Decision should be EXPIRED, got: ${dec.status}`);
    }

    // Ensure it was logged in the audit trail
    const expiredLog = dec.auditTrail.find(a => a.action === AuditAction.EXPIRED);
    if (!expiredLog) throw new Error("No expiration audit log found");
  });

  // --- TEST 6: Conflict Resolution ---
  await test("Conflict Detection - Identifies duplicates, contradictory approvals, resource allocations, and priority inversions", async () => {
    HumanDecisionWorkflowManager.resetInstance();
    const cManager = HumanDecisionWorkflowManager.getInstance();

    // 6.1 Duplicate Detection
    const rec1 = createMockEnhancedRecommendation("REC-C1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy Security Unit 4 to gate A");
    const rec2 = createMockEnhancedRecommendation("REC-C2", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy Security Unit 4 to gate A");
    
    const dec1 = cManager.ingestRecommendation(rec1);
    const dec2 = cManager.ingestRecommendation(rec2);

    cManager.detectConflicts();

    const hasDuplicateConflict = dec2.conflicts.some(c => c.type === ConflictType.DUPLICATE_DECISIONS);
    if (!hasDuplicateConflict) throw new Error("Failed to detect duplicate recommendation conflict");

    // 6.2 Resource Double Allocation
    // Let's modify recommendedAction to contain same security unit identifier: "security unit 4"
    dec1.explanation.affectedResources = ["security unit 4"];
    dec2.explanation.affectedResources = ["security unit 4"];

    cManager.detectConflicts();
    const hasResourceConflict = dec1.conflicts.some(c => c.type === ConflictType.RESOURCE_CONFLICTS);
    if (!hasResourceConflict) throw new Error("Failed to detect resource double allocation conflict");

    // 6.3 Conflicting Approvals (Contradictory approved directives in overlapping zones)
    // Overlapping zone: "East Entrance Concourse"
    dec1.title = "Direct all spectators to Gate A";
    dec2.title = "Close Gate A immediately and redirect spectators to West Side";
    dec1.status = WorkflowStatus.APPROVED;
    dec2.status = WorkflowStatus.APPROVED;

    cManager.detectConflicts();
    const hasConflictingApprovals = dec1.conflicts.some(c => c.type === ConflictType.CONFLICTING_APPROVALS);
    if (!hasConflictingApprovals) throw new Error("Failed to detect contradictory approved directives conflict");

    // 6.4 Priority Inversion
    // Lower priority approved, while higher priority is pending in overlapping zones
    const recHigh = createMockEnhancedRecommendation("REC-HIGH", RecommendationType.SECURITY, ActionPriority.HIGH, "Emergency exit deployment at Gate A");
    const recLow = createMockEnhancedRecommendation("REC-LOW", RecommendationType.SECURITY, ActionPriority.LOW, "Regular trash pickup at Gate A");

    const decHigh = cManager.ingestRecommendation(recHigh);
    const decLow = cManager.ingestRecommendation(recLow);

    decLow.status = WorkflowStatus.APPROVED;
    decHigh.status = WorkflowStatus.PENDING_REVIEW;

    cManager.detectConflicts();
    const hasPriorityInversion = decLow.conflicts.some(c => c.type === ConflictType.PRIORITY_INVERSIONS);
    if (!hasPriorityInversion) throw new Error("Failed to detect priority inversion conflict");
  });

  // --- TEST 7: Post-Execution Feedback & Learning Signals ---
  await test("Post-Execution Feedback - Collects operator evaluations and captures structured quality signals", async () => {
    const fManager = HumanDecisionWorkflowManager.getInstance();
    const rec = createMockEnhancedRecommendation("REC-FB-1", RecommendationType.TRANSPORT, ActionPriority.MEDIUM, "Add extra shuttle buses");
    const dec = fManager.ingestRecommendation(rec);

    dec.status = WorkflowStatus.APPROVED; // approve first
    fManager.executeDecision(dec.id, "operator_sara");

    if ((dec as any).status !== WorkflowStatus.EXECUTED) {
      throw new Error("Decision status should be EXECUTED");
    }

    fManager.submitFeedback(dec.id, {
      outcome: ExecutionOutcome.SUCCESSFUL,
      notes: "Shuttle deployment resolved transit backlog under 10 minutes.",
      learningSignals: {
        rationaleAccuracy: 5,
        ragRelevance: 4,
        confidenceAlignment: 5,
        suggestionCorrectness: 5
      },
      operatorId: "operator_sara",
      timestamp: new Date().toISOString()
    });

    if (!dec.feedback) throw new Error("Feedback was not saved");
    if (dec.feedback.outcome !== ExecutionOutcome.SUCCESSFUL) throw new Error("Outcome mismatch");
    if (dec.feedback.learningSignals.rationaleAccuracy !== 5) throw new Error("Learning signal accuracy score mismatch");
  });

  // --- TEST 8: Workflow Metrics Calculations ---
  await test("Metrics Dashboard Telemetry - Calculates and monitors accurate throughput performance", async () => {
    // Clear mock DB recommendations to isolate metrics calculation
    (mockDb.recommendations as any).items = [];
    HumanDecisionWorkflowManager.resetInstance();
    const mManager = HumanDecisionWorkflowManager.getInstance();
    mManager.clear();

    const rec1 = createMockEnhancedRecommendation("REC-M1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Direct spectators");
    const rec2 = createMockEnhancedRecommendation("REC-M2", RecommendationType.TRANSPORT, ActionPriority.MEDIUM, "Dispatch buses");
    const rec3 = createMockEnhancedRecommendation("REC-M3", RecommendationType.MEDICAL, ActionPriority.MEDIUM, "Dispatch paramedic");

    const dec1 = mManager.ingestRecommendation(rec1);
    const dec2 = mManager.ingestRecommendation(rec2);
    const dec3 = mManager.ingestRecommendation(rec3);

    // View action logged
    mManager.viewDecision(dec1.id, "op_mike", ReviewerRole.SECURITY);

    // Approve one
    await mManager.approveDecision(dec1.id, "op_mike", ReviewerRole.SECURITY, "Signoff", true);
    mManager.executeDecision(dec1.id, "op_mike");
    mManager.submitFeedback(dec1.id, {
      outcome: ExecutionOutcome.SUCCESSFUL,
      notes: "Perfect",
      learningSignals: { rationaleAccuracy: 5, ragRelevance: 5, confidenceAlignment: 5, suggestionCorrectness: 5 },
      operatorId: "op_mike",
      timestamp: new Date().toISOString()
    });

    // Reject one
    await mManager.rejectDecision(dec2.id, "op_mike", ReviewerRole.TRANSPORT, "Invalid resource count");

    // Metrics calculation
    const metrics = mManager.getMetrics();

    // 2 reviewed (dec1 and dec2). 1 approved, 1 rejected.
    if (metrics.approvalRate !== 0.5) throw new Error(`Expected 50% approval rate, got: ${metrics.approvalRate}`);
    if (metrics.rejectedRecommendationRate !== 0.5) throw new Error(`Expected 50% reject rate, got: ${metrics.rejectedRecommendationRate}`);
    if (metrics.executionSuccessRate !== 1.0) throw new Error(`Expected 100% execution success, got: ${metrics.executionSuccessRate}`);
    
    // Workload: dec3 is still pending assigned to Medical
    if (metrics.reviewerWorkload[ReviewerRole.MEDICAL] !== 1) {
      throw new Error("Active workload counts incorrect");
    }
  });

  console.log("=== TEST RESULTS SUMMARY ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    throw new Error(`Workflow tests failed with ${failed} issues.`);
  } else {
    console.log("HUMAN DECISION WORKFLOW COMPLETED ALL TESTS SUCCESSFULLY! 🎉");
  }
}

runWorkflowTests().catch(err => {
  console.error("Workflow tests failed to run to completion:", err);
  process.exit(1);
});
