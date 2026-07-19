/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Incident, 
  Gate, 
  Match, 
  TransportLine, 
  Weather, 
  CrowdZone 
} from "../../types";
import { AIErrorCode } from "./errors";

/**
 * Normalized Context representation.
 * Gathers complete stadium operational and situational state.
 */
export interface AIRequestContext {
  timestamp: string;
  currentTime: string;
  matchState: Match | null;
  weatherState: Weather | null;
  activeIncidents: Incident[];
  crowdZones: CrowdZone[];
  gates: Gate[];
  transportLines: TransportLine[];
  resources: {
    volunteers: any[];
    medicalTeams: any[];
    securityTeams: any[];
    accessibilityResources: any[];
  };
  operatorSession: {
    userId: string;
    role: string;
    activeScenarioId?: string;
  } | null;
  operationalPolicies: string[];
}

/**
 * Registered system prompt structure.
 */
export interface AIPrompt {
  id: string;
  version: string;
  category: string;
  metadata: {
    title: string;
    description: string;
    author: string;
    tags: string[];
    createdAt: string;
  };
  template: string; // Dynamic parameter template (e.g. "Evaluate incident: {{incident.id}}")
  requiredParameters: string[];
}

/**
 * Request execution configuration options.
 */
export interface AIRequestOptions {
  promptId: string;
  promptVersion?: string;
  parameters: Record<string, any>;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timeoutMs?: number;
  retries?: number;
  correlationId?: string;
  responseSchema?: any; // JSON Schema for response validation
}

/**
 * Validation result descriptor.
 */
export interface AIValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: string[];
  repaired?: boolean;
}

/**
 * Standard confidence rating.
 */
export interface AIConfidenceMetric {
  overallScore: number; // Normalized 0.0 to 1.0
  factors: {
    contextCompleteness: number; // 0.0 to 1.0
    modelCertainty: number;       // 0.0 to 1.0
    historicalSimilarity: number; // 0.0 to 1.0
  };
  explanation: string;
}

/**
 * Final execution envelope returned from the AI Runtime pipeline.
 */
export interface AIResponse<T = any> {
  rawResponse: string;
  parsedData: T;
  confidence: AIConfidenceMetric;
  auditEntry: AIAuditEntry;
}

/**
 * Complete operational audit ledger entry.
 */
export interface AIAuditEntry {
  id: string;
  promptId: string;
  promptVersion: string;
  correlationId: string;
  providerId: string;
  modelName: string;
  latencyMs: number;
  executionTime: string;
  validationStatus: "SUCCESS" | "FAILED" | "REPAIRED";
  validationErrors?: string[];
  operatorDecision?: "APPROVED" | "REJECTED" | "PENDING";
  operatorDecisionTime?: string;
  contextSnapshot: AIRequestContext;
  safetyRatings?: any[];
}

/**
 * Standardized AI Provider Interface.
 * Allows decoupling the core runtime from specific model vendors.
 */
export interface AIProvider {
  id: string;
  name: string;
  supportedModels: string[];
  defaultModel: string;
  
  generate(
    promptText: string,
    options?: {
      model?: string;
      temperature?: number;
      responseMimeType?: string;
      timeoutMs?: number;
      signal?: AbortSignal;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }
  ): Promise<{
    text: string;
    modelUsed: string;
    finishReason: string;
  }>;
}
