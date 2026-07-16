/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DecisionState {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  MODIFIED = "MODIFIED",
}

export enum ActionPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface ActionStep {
  targetGroupId: string;
  actionDescription: string;
  priority: ActionPriority;
}

export interface Proposal {
  analysisSummary: string;
  actionSteps: ActionStep[];
  alternativeStrategy: string;
  predictedOutcomes: string;
}

export interface AiRecommendation {
  id: string;
  incidentId: string;
  confidenceScore: number; // 0.0 to 1.0
  decisionState: DecisionState;
  proposal: Proposal;
  operatorId?: string;
  createdAt: string; // ISO string
  evaluatedAt?: string; // ISO string
}
