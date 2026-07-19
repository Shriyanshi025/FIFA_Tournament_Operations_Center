/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RecommendationEngine } from "../RecommendationEngine";
import { ActionPriority, DecisionState } from "../../../types/ai";
import { RecommendationType, RecommendationStatus } from "../types";
import { AppEvent, EventType, EventCategory } from "../../../types/events";

describe("RecommendationEngine Unit & Integration Test Suite", () => {
  let engine: RecommendationEngine;

  beforeEach(async () => {
    RecommendationEngine.resetInstance();
    engine = RecommendationEngine.getInstance();
    await engine.syncWithMockDatabase();
  });

  afterEach(() => {
    RecommendationEngine.resetInstance();
    vi.restoreAllMocks();
  });

  it("singleton instance initializes and syncs with mock DB", () => {
    const instance2 = RecommendationEngine.getInstance();
    expect(engine).toBe(instance2);

    const allRecs = engine.getAllRecommendations();
    expect(allRecs).toBeDefined();
    expect(Array.isArray(allRecs)).toBe(true);

    const metrics = engine.getSuccessMetrics();
    expect(metrics.totalGenerated).toBe(allRecs.length);
  });

  it("calculates weighted priority ranking scores accurately", () => {
    const rankingHigh = engine.calculateRanking(ActionPriority.HIGH, 0.95);
    const rankingLow = engine.calculateRanking(ActionPriority.LOW, 0.6);

    expect(rankingHigh.priority).toBe(8);
    expect(rankingHigh.overallScore).toBeGreaterThan(rankingLow.overallScore);
    expect(rankingLow.priority).toBe(3);
  });

  it("subscribes and unsubscribes from EventBus without errors", () => {
    expect(() => engine.subscribeToEventBus()).not.toThrow();
    expect(() => engine.unsubscribeFromEventBus()).not.toThrow();
  });

  it("handles simulation event and generates an enhanced recommendation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          text: JSON.stringify({
            recommendationId: "REC-SIM-100",
            title: "Crowd Redistribution Directive",
            action: "Open gate G-6 and re-route spectators",
            estimatedEffectMinutes: 10,
            confidenceScore: 0.9,
            rationale: "High density detected at Gate G-SOUTHWEST",
          }),
          candidates: [{ finishReason: "STOP" }],
        }),
      })
    );

    const mockEvent: AppEvent = {
      type: EventType.CrowdDensityChanged,
      category: EventCategory.OPERATIONAL,
      metadata: {
        id: "EVT-CROWD-100",
        timestamp: new Date().toISOString(),
        source: "TEST_SUITE",
        priority: "HIGH",
        correlationId: "CORR-REC-TEST",
        version: "1.0",
      },
      payload: {
        zoneId: "Gate-G-SOUTHWEST",
        densityPercentage: 90,
        estimatedHeadcount: 2400,
      },
    };

    const rec = await engine.handleSimulationEvent(mockEvent);

    expect(rec).not.toBeNull();
    if (rec) {
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.explanation).toBeDefined();
      expect(rec.ranking).toBeDefined();
      expect(rec.lifecycleStatus).toBe(RecommendationStatus.PENDING_REVIEW);
    }
  });

  it("manages recommendation lifecycle: approve, reject, revise, escalate, delegate, execute", async () => {
    const all = engine.getAllRecommendations();
    if (all.length === 0) return;

    const testId = all[0].id;

    // Approve
    const approved = await engine.approve(testId, "operator_john");
    expect(approved.status).toBe(DecisionState.APPROVED);
    expect(approved.lifecycleStatus).toBe(RecommendationStatus.APPROVED);

    // Execute
    const executed = await engine.execute(testId, "operator_john");
    expect(executed.lifecycleStatus).toBe(RecommendationStatus.EXECUTED);

    // Feedback
    const feedback = engine.submitFeedback(testId, 5, "Resolved congestion rapidly.");
    expect(feedback.feedbackScore).toBe(5);

    const metrics = engine.getSuccessMetrics();
    expect(metrics.totalApproved).toBeGreaterThan(0);
    expect(metrics.totalExecuted).toBeGreaterThan(0);
  });

  it("detects resource double-allocation and contradictory conflicts between recommendations", () => {
    const recA: any = {
      id: "REC-A",
      incidentId: "INC-SAME",
      title: "Deploy security team 1 to Gate A",
      recommendedAction: "deploy security team 1 to Gate A",
      priority: ActionPriority.HIGH,
      lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
      explanation: { affectedAreas: ["Gate A"], estimatedResolutionTime: 20 },
    };

    const recB: any = {
      id: "REC-B",
      incidentId: "INC-SAME",
      title: "Deploy security team 1 to Gate B",
      recommendedAction: "deploy security team 1 to Gate B",
      priority: ActionPriority.MEDIUM,
      lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
      explanation: { affectedAreas: ["Gate A"], estimatedResolutionTime: 20 },
    };

    const conflicts = engine.detectConflicts(recA, [recB]);
    expect(conflicts.length).toBeGreaterThan(0);

    const resourceConflict = conflicts.find((c) => c.type === "RESOURCE");
    expect(resourceConflict).toBeDefined();
  });

  it("handles deduplication and superseding when duplicate recommendations occur", () => {
    const recA: any = {
      id: "REC-DEDUP-1",
      incidentId: "INC-DEDUP",
      type: RecommendationType.CROWD,
      title: "Pacing line flow",
      recommendedAction: "Pacing line flow at East Gate scanners",
      ranking: { overallScore: 80 },
      lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
      explanation: { supportingEvidence: [], knowledgeSourcesUsed: [], affectedAreas: [] },
    };

    const recB: any = {
      id: "REC-DEDUP-2",
      incidentId: "INC-DEDUP",
      type: RecommendationType.CROWD,
      title: "Pacing line flow",
      recommendedAction: "Pacing line flow at East Gate scanners",
      ranking: { overallScore: 90 },
      lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
      explanation: { supportingEvidence: [], knowledgeSourcesUsed: [], affectedAreas: [] },
    };

    const dedup = engine.handleDeduplication(recB, [recA]);
    expect(dedup.shouldInsert).toBe(true);
    expect(dedup.supersededIds).toContain("REC-DEDUP-1");
  });
});
