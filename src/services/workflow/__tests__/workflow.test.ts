/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ActionPriority, DecisionState } from "../../../types/ai";
import { HumanDecisionWorkflowManager } from "../HumanDecisionWorkflow";
import { EnhancedRecommendation, RecommendationType, RecommendationStatus } from "../../recommendations/types";
import {
  WorkflowStatus,
  ReviewerRole,
  AuditAction,
  ConflictType,
  ExecutionOutcome,
} from "../types";

describe("Human Decision Workflow Unit & Integration Test Suite", () => {
  let manager: HumanDecisionWorkflowManager;

  function createMockEnhancedRecommendation(
    id: string,
    type: RecommendationType,
    priority: ActionPriority,
    title: string
  ): EnhancedRecommendation {
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
        affectedAreas: ["East Entrance Concourse"],
      },
      ranking: {
        priority: 7,
        confidence: 0.88,
        operationalImpact: 6,
        timeSensitivity: 5,
        resourceCost: 4,
        riskReduction: 6,
        overallScore: 78,
      },
      conflicts: [],
      auditTrail: [],
    };
  }

  beforeEach(() => {
    HumanDecisionWorkflowManager.resetInstance();
    manager = HumanDecisionWorkflowManager.getInstance();
    manager.clear();
  });

  it("converts recommendation to decision workflow and validates fields", () => {
    const rec = createMockEnhancedRecommendation(
      "REC-TEST-1",
      RecommendationType.CROWD,
      ActionPriority.MEDIUM,
      "Pacing scan lines"
    );
    const dec = manager.ingestRecommendation(rec);

    expect(dec.id).toBe("REC-TEST-1");
    expect(dec.status).toBe(WorkflowStatus.PENDING_REVIEW);
    expect(dec.assignedRole).toBe(ReviewerRole.VOLUNTEER);
    expect(dec.explanation.confidence).toBe(0.88);
    expect(dec.auditTrail.length).toBe(1);
    expect(dec.auditTrail[0].action).toBe(AuditAction.CREATED);
  });

  it("handles complex sorting, filtering, searching and grouping queries", () => {
    manager.clear();
    const rec1 = createMockEnhancedRecommendation("REC-S1", RecommendationType.SECURITY, ActionPriority.HIGH, "Emergency VIP Protection");
    const rec2 = createMockEnhancedRecommendation("REC-S2", RecommendationType.CROWD, ActionPriority.LOW, "Pacing line flow");
    const rec3 = createMockEnhancedRecommendation("REC-S3", RecommendationType.MEDICAL, ActionPriority.MEDIUM, "Heat fatigue hydration dispatch");

    manager.ingestRecommendation(rec1);
    manager.ingestRecommendation(rec2);
    manager.ingestRecommendation(rec3);

    const searchResult = manager.getQueue({ searchQuery: "fatigue" });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].id).toBe("REC-S3");

    const sortedResult = manager.getQueue({ sortBy: "priority", sortOrder: "desc" });
    expect(sortedResult[0].id).toBe("REC-S1");
    expect(sortedResult[2].id).toBe("REC-S2");

    const filteredResult = manager.getQueue({ filterByRole: [ReviewerRole.SECURITY] });
    expect(filteredResult.length).toBe(1);
    expect(filteredResult[0].id).toBe("REC-S1");

    const grouped = manager.getGroupedQueue("priority");
    expect(grouped[ActionPriority.HIGH].length).toBe(1);
    expect(grouped[ActionPriority.LOW].length).toBe(1);
  });

  it("manages assigning decisions to roles and specific operators", () => {
    const rec = createMockEnhancedRecommendation("REC-A1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy extra bag check lane");
    const dec = manager.ingestRecommendation(rec);

    manager.assignDecision(dec.id, ReviewerRole.SECURITY, "commander_john", "admin_lucas");

    expect(dec.assignedRole).toBe(ReviewerRole.SECURITY);
    expect(dec.assignedReviewerId).toBe("commander_john");
    expect(dec.status).toBe(WorkflowStatus.ASSIGNED_REVIEWER);

    const latestAudit = dec.auditTrail[dec.auditTrail.length - 1];
    expect(latestAudit.action).toBe(AuditAction.ASSIGNED);
    expect(latestAudit.reviewer).toBe("admin_lucas");
  });

  it("enforces approval rules (single, multi-level, fast-track)", async () => {
    const rec1 = createMockEnhancedRecommendation("REC-RULE-1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "CCTV Scan Sector East");
    const dec1 = manager.ingestRecommendation(rec1);

    await expect(
      manager.approveDecision(dec1.id, "john_123", ReviewerRole.SECURITY, "Looks correct", false)
    ).rejects.toThrow(/Mandatory operational check signature/);

    await manager.approveDecision(dec1.id, "john_123", ReviewerRole.SECURITY, "Looks correct", true);
    expect(dec1.status).toBe(WorkflowStatus.APPROVED);

    const rec2 = createMockEnhancedRecommendation("REC-RULE-2", RecommendationType.CROWD, ActionPriority.MEDIUM, "Gate A re-routing");
    const dec2 = manager.ingestRecommendation(rec2);

    await manager.approveDecision(dec2.id, "v_coord", ReviewerRole.VOLUNTEER, "Approved step 1", true);
    expect(dec2.status).not.toBe(WorkflowStatus.APPROVED);

    await manager.approveDecision(dec2.id, "toc_operator", ReviewerRole.TOC, "Approved step 2", true);
    expect(dec2.status).toBe(WorkflowStatus.APPROVED);
  });

  it("expires inactive decisions automatically", () => {
    const rec = createMockEnhancedRecommendation("REC-EXP-1", RecommendationType.MEDICAL, ActionPriority.MEDIUM, "Medical response team B");
    const dec = manager.ingestRecommendation(rec);

    dec.expiresAt = new Date(Date.now() - 5000).toISOString();
    manager.checkExpirations();

    expect(dec.status).toBe(WorkflowStatus.EXPIRED);
    expect(dec.auditTrail.some((a) => a.action === AuditAction.EXPIRED)).toBe(true);
  });

  it("detects conflicts: duplicates, double allocations, contradictory directives, priority inversions", () => {
    const rec1 = createMockEnhancedRecommendation("REC-C1", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy Security Unit 4 to gate A");
    const rec2 = createMockEnhancedRecommendation("REC-C2", RecommendationType.SECURITY, ActionPriority.MEDIUM, "Deploy Security Unit 4 to gate A");

    const dec1 = manager.ingestRecommendation(rec1);
    const dec2 = manager.ingestRecommendation(rec2);

    manager.detectConflicts();

    expect(dec2.conflicts.some((c) => c.type === ConflictType.DUPLICATE_DECISIONS)).toBe(true);
  });

  it("collects operator feedback and calculates throughput metrics", async () => {
    const rec = createMockEnhancedRecommendation("REC-FB-1", RecommendationType.TRANSPORT, ActionPriority.MEDIUM, "Add extra shuttle buses");
    const dec = manager.ingestRecommendation(rec);

    dec.status = WorkflowStatus.APPROVED;
    manager.executeDecision(dec.id, "operator_sara");
    expect(dec.status).toBe(WorkflowStatus.EXECUTED);

    manager.submitFeedback(dec.id, {
      outcome: ExecutionOutcome.SUCCESSFUL,
      notes: "Shuttle deployment resolved transit backlog.",
      learningSignals: { rationaleAccuracy: 5, ragRelevance: 4, confidenceAlignment: 5, suggestionCorrectness: 5 },
      operatorId: "operator_sara",
      timestamp: new Date().toISOString(),
    });

    expect(dec.feedback).toBeDefined();
    expect(dec.feedback?.outcome).toBe(ExecutionOutcome.SUCCESSFUL);
  });
});
