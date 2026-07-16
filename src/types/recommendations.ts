/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionPriority, DecisionState } from "./ai";

export interface OperationalRecommendation {
  id: string;
  incidentId?: string; // optional association with an incident
  title: string;
  reason: string;
  evidence: string[]; // Bulleted lists
  recommendedAction: string;
  expectedOutcome: string;
  confidenceScore: number; // 0.0 to 1.0
  priority: ActionPriority;
  status: DecisionState;
  operatorId?: string;
  createdAt: string; // ISO string
  resolvedAt?: string; // ISO string
}
