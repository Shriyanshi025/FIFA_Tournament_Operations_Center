/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationalRecommendation } from "../../types/recommendations";
import { ActionPriority, DecisionState } from "../../types/ai";

/**
 * Domain-specific Recommendation Types.
 */
export enum RecommendationType {
  CROWD = "CROWD",
  SECURITY = "SECURITY",
  MEDICAL = "MEDICAL",
  VOLUNTEER = "VOLUNTEER",
  TRANSPORT = "TRANSPORT",
  ACCESSIBILITY = "ACCESSIBILITY",
  WEATHER = "WEATHER",
  SUSTAINABILITY = "SUSTAINABILITY",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  MATCH_OPERATIONS = "MATCH_OPERATIONS"
}

/**
 * Granular Lifecycle Status of a Recommendation.
 */
export enum RecommendationStatus {
  DRAFT = "Draft",
  PENDING_REVIEW = "Pending Review",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  EXPIRED = "Expired",
  EXECUTED = "Executed",
  CANCELLED = "Cancelled",
  ARCHIVED = "Archived"
}

/**
 * Operational actions for human approval flow.
 */
export enum ReviewAction {
  APPROVE = "Approve",
  REJECT = "Reject",
  REQUEST_REVISION = "Request Revision",
  ESCALATE = "Escalate",
  DELEGATE = "Delegate"
}

/**
 * Structured Operational Explanation for the operator.
 */
export interface RecommendationExplanation {
  summary: string;
  reasoning: string;
  supportingEvidence: string[];
  knowledgeSourcesUsed: string[]; // e.g. ["sop-weather-lightning-strike"]
  confidence: number;             // 0.0 to 1.0
  expectedOutcome: string;
  potentialRisks: string[];
  alternativeOptions: string[];
  estimatedResolutionTime: number; // in minutes
  affectedAreas: string[];
}

/**
 * Metric breakdown used for ranking recommendations.
 */
export interface RankingMetrics {
  priority: number;          // 1-10 (derived from ActionPriority & situation urgency)
  confidence: number;        // 0.0-1.0
  operationalImpact: number; // 1-10
  timeSensitivity: number;   // 1-10
  resourceCost: number;      // 1-10 (lower is better, or represented in overall score calculation)
  riskReduction: number;     // 1-10
  overallScore: number;      // 0-100 (weighted aggregate score)
}

/**
 * Detailed representation of a detected conflict.
 */
export interface RecommendationConflict {
  id: string;
  type: "CONTRADICTORY" | "RESOURCE" | "TIMING" | "PRIORITY";
  recommendationIds: string[];
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolutionAction?: string;
}

/**
 * Recommendation Audit Trail log entry.
 */
export interface RecommendationAuditLog {
  id: string;
  recommendationId: string;
  timestamp: string;
  actor: string; // e.g. "AI_SYSTEM", "OPERATOR_42"
  action: "CREATE" | "UPDATE" | "APPROVE" | "REJECT" | "REQUEST_REVISION" | "ESCALATE" | "DELEGATE" | "EXECUTE" | "EXPIRE" | "CANCEL" | "ARCHIVE" | "FEEDBACK";
  payload?: any;
  notes?: string;
}

/**
 * Real-time Success and Quality metrics for the Recommendation Engine.
 */
export interface SuccessMetrics {
  totalGenerated: number;
  totalApproved: number;
  totalRejected: number;
  totalExecuted: number;
  acceptanceRate: number;              // totalApproved / totalReviewed
  averageExecutionTimeMinutes: number; // generation to execution
  recommendationAccuracy: number;      // based on feedback/outcomes
  falsePositivesCount: number;         // rejected due to poor relevance
  falseNegativesCount: number;         // manual interventions needed where AI had no coverage
  operatorOverridesCount: number;      // modified/revised by operator
  averageConfidence: number;
  averageOperationalImpact: number;
}

/**
 * Fully-parameterized recommendation entity extending the frozen OperationalRecommendation model.
 */
export interface EnhancedRecommendation extends OperationalRecommendation {
  type: RecommendationType;
  lifecycleStatus: RecommendationStatus;
  explanation: RecommendationExplanation;
  ranking: RankingMetrics;
  conflicts: RecommendationConflict[];
  auditTrail: RecommendationAuditLog[];
  supersededBy?: string;
  supersedes?: string;
  assignedTo?: string;
  revisionNotes?: string;
  feedbackScore?: number; // 1 to 5 stars
  feedbackText?: string;
}
