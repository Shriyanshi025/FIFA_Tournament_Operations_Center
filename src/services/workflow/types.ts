/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionPriority, DecisionState } from "../../types/ai";
import { OperationalRecommendation } from "../../types/recommendations";

/**
 * Human-AI Reviewer Roles representing operational command centers and discipline heads.
 */
export enum ReviewerRole {
  TOC = "Tournament Operations Center",
  SECURITY = "Security Commander",
  MEDICAL = "Medical Coordinator",
  VOLUNTEER = "Volunteer Coordinator",
  TRANSPORT = "Transport Manager",
  VENUE = "Venue Manager",
  ACCESSIBILITY = "Accessibility Officer",
  ENVIRONMENTAL = "Environmental Operations"
}

/**
 * Enhanced Human Decision Lifecycle Status.
 */
export enum WorkflowStatus {
  PENDING_REVIEW = "Pending Review",
  ASSIGNED_REVIEWER = "Assigned Reviewer",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  NEEDS_REVISION = "Needs Revision",
  ESCALATED = "Escalated",
  EXPIRED = "Expired",
  EXECUTED = "Executed",
  ARCHIVED = "Archived",
  CANCELLED = "Cancelled"
}

/**
 * Type of approval workflow ruleset.
 */
export enum ApprovalRuleType {
  SINGLE_APPROVAL = "Single Approval",
  MULTI_LEVEL = "Multi-level Approval",
  PARALLEL = "Parallel Approval",
  EMERGENCY_FAST_TRACK = "Emergency Fast-Track"
}

/**
 * Configuration for the Approval Rules Engine.
 */
export interface ApprovalRuleConfig {
  id: string;
  name: string;
  type: ApprovalRuleType;
  requiredRoles: ReviewerRole[];
  minApprovalsNeeded: number; // For parallel approvals
  timeoutMinutes: number;      // 0 for no timeout; automatic time-based expiration
  mandatoryAcknowledgement: boolean; // Needs explicit human checklist signature
  bypassOnPriority: ActionPriority[]; // Priorities that can fast-track/bypass standard multi-level rules
}

/**
 * Step in a multi-level or parallel approval chain.
 */
export interface ApprovalStep {
  stepIndex: number;
  role: ReviewerRole;
  approverId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  timestamp?: string;
  notes?: string;
}

/**
 * Structure containing full explanation and contextual justification of a recommendation.
 */
export interface WorkflowDecisionExplanation {
  aiSummary: string;
  reasoning: string;
  supportingEvidence: string[];
  knowledgeSources: string[];      // SOP document IDs or handbook references
  confidence: number;              // 0.0 to 1.0 confidence score
  riskAnalysis: string[];          // List of risks identified
  alternativeOptions: string[];    // Fallbacks or alternatives
  expectedOutcome: string;
  estimatedResolutionTime: number; // in minutes
  affectedResources: string[];     // e.g. ["Volunteer Group East", "Security Unit 4"]
  affectedZones: string[];         // e.g. ["Gate B Concourse", "Sector East Row 10-20"]
}

/**
 * Action type recorded in the permanent Workflow Audit Trail.
 */
export enum AuditAction {
  CREATED = "CREATED",
  VIEWED = "VIEWED",
  ASSIGNED = "ASSIGNED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  MODIFIED = "MODIFIED",
  EXECUTED = "EXECUTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED"
}

/**
 * Entry in the human decision workflow audit trail log.
 */
export interface WorkflowAuditEntry {
  id: string;
  decisionId: string;
  timestamp: string;
  action: AuditAction;
  reviewer?: string; // Operator ID or system agent identifier
  role?: ReviewerRole;
  reason?: string;
  payload?: Record<string, any>;
}

/**
 * Categories of operational conflicts detected by the validation engine.
 */
export enum ConflictType {
  CONFLICTING_APPROVALS = "Conflicting Approvals", // e.g. two approved contradictory recommendations
  DUPLICATE_DECISIONS = "Duplicate Decisions",     // e.g. identical or redundant recommendations active
  EXPIRED_APPROVALS = "Expired Approvals",         // e.g. attempting actions on expired drafts
  RESOURCE_CONFLICTS = "Resource Conflicts",       // e.g. the same resources assigned to overlapping tasks
  PRIORITY_INVERSIONS = "Priority Inversions"      // e.g. low-priority task executing before high-priority one in same zone
}

/**
 * Representation of a detected conflict.
 */
export interface WorkflowConflict {
  id: string;
  type: ConflictType;
  decisionIds: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  resolutionAction: string;
}

/**
 * Execution outcome rating submitted by the operator.
 */
export enum ExecutionOutcome {
  SUCCESSFUL = "Successful",
  PARTIALLY_SUCCESSFUL = "Partially Successful",
  FAILED = "Failed",
  UNEXPECTED_OUTCOME = "Unexpected Outcome"
}

/**
 * Learning Signals captured from post-execution human feedback to assess and evaluate AI quality.
 */
export interface LearningSignals {
  rationaleAccuracy: number;      // 1 to 5 stars
  ragRelevance: number;           // 1 to 5 stars
  confidenceAlignment: number;    // 1 to 5 stars (did confidence match ground truth?)
  suggestionCorrectness: number;  // 1 to 5 stars (was suggested action correct?)
}

/**
 * Post-execution human feedback and telemetry tracking.
 */
export interface OperatorFeedback {
  outcome: ExecutionOutcome;
  notes: string;
  learningSignals: LearningSignals;
  operatorId: string;
  timestamp: string;
}

/**
 * Fully hydrated Human Decision Workflow entity.
 */
export interface WorkflowDecision {
  id: string;
  recommendationId: string; // reference to base recommendation
  title: string;
  priority: ActionPriority;
  status: WorkflowStatus;
  assignedRole?: ReviewerRole;
  assignedReviewerId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // time-based expiration boundary
  ruleConfig: ApprovalRuleConfig;
  approvalChain: ApprovalStep[];
  explanation: WorkflowDecisionExplanation;
  auditTrail: WorkflowAuditEntry[];
  conflicts: WorkflowConflict[];
  feedback?: OperatorFeedback;
  acknowledgementSigned?: boolean;
}

/**
 * Comprehensive metrics suite tracking the human approval workflow throughput and efficacy.
 */
export interface WorkflowMetrics {
  approvalRate: number;                  // Ratio of approved over total reviewed
  averageReviewTimeMinutes: number;      // Time from creation to final decision (Approve/Reject)
  escalationRate: number;                // Ratio of escalated decisions over total reviewed
  executionSuccessRate: number;          // Ratio of SUCCESSFUL executions over total executed
  overrideRate: number;                  // Ratio of NEEDS_REVISION / MODIFIED decisions over total reviewed
  rejectedRecommendationRate: number;    // Ratio of rejected decisions over total reviewed
  averageResolutionTimeMinutes: number;  // Time from creation to fully executed
  reviewerWorkload: Record<ReviewerRole, number>; // Active task count per role
}

/**
 * Sorting, searching, and filtering options for the centralized queue.
 */
export interface QueueQueryParams {
  sortBy?: "priority" | "createdAt" | "expiresAt" | "confidence";
  sortOrder?: "asc" | "desc";
  filterByStatus?: WorkflowStatus[];
  filterByRole?: ReviewerRole[];
  searchQuery?: string;
  groupBy?: "status" | "role" | "priority";
}
