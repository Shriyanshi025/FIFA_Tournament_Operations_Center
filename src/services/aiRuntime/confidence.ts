/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIConfidenceMetric, AIRequestContext } from "./types";

export class ConfidenceEngine {
  /**
   * Evaluates and normalizes confidence metrics based on situational context and model response details.
   */
  public static evaluate(
    context: AIRequestContext,
    reportedModelCertainty: number, // 0.0 to 1.0
    options?: { historicalSimilarity?: number }
  ): AIConfidenceMetric {
    // 1. Calculate Context Completeness score based on populated fields
    let completenessFactors = 0;
    let maxCompletenessFactors = 6;

    if (context.matchState) completenessFactors++;
    if (context.weatherState) completenessFactors++;
    if (context.activeIncidents.length > 0) completenessFactors++;
    if (context.gates.length > 0) completenessFactors++;
    if (context.transportLines.length > 0) completenessFactors++;
    if (
      context.resources.volunteers.length > 0 ||
      context.resources.securityTeams.length > 0
    ) {
      completenessFactors++;
    }

    const contextCompleteness = completenessFactors / maxCompletenessFactors;

    // 2. Resolve Historical similarity
    const historicalSimilarity = options?.historicalSimilarity ?? 0.85;

    // 3. Overall confidence score weighted average
    // Weightings: 40% Model Certainty, 40% Context Completeness, 20% Historical Similarity
    const rawScore = 
      (reportedModelCertainty * 0.40) + 
      (contextCompleteness * 0.40) + 
      (historicalSimilarity * 0.20);
    
    // Normalize to 0.0 - 1.0 range safely
    const overallScore = Math.max(0.0, Math.min(1.0, Number(rawScore.toFixed(2))));

    // 4. Draft friendly human explanation
    let explanation = "Confidence is optimal. State representation is fully complete.";
    if (overallScore < 0.5) {
      explanation = "Critical Confidence Warning: Context is heavily incomplete or the model reports extreme uncertainty.";
    } else if (overallScore < 0.75) {
      explanation = "Moderate Confidence: Some missing state fields or slightly below-average model certainty.";
    }

    return {
      overallScore,
      factors: {
        contextCompleteness,
        modelCertainty: reportedModelCertainty,
        historicalSimilarity
      },
      explanation
    };
  }
}
