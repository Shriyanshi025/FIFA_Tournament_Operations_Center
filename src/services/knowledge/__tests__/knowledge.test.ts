/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryKnowledgeRepository } from "../repository";
import { MockEmbeddingProvider } from "../embeddings";
import { KnowledgeRetrievalEngine } from "../retrievalEngine";
import { validateKnowledgeAsset } from "../validation";
import { KnowledgeCategory, KnowledgeStatus, KnowledgePriority, KnowledgeAsset } from "../types";

describe("Knowledge Layer & RAG Retrieval Engine Test Suite", () => {
  let repository: InMemoryKnowledgeRepository;
  let embeddingProvider: MockEmbeddingProvider;
  let engine: KnowledgeRetrievalEngine;

  beforeEach(() => {
    repository = new InMemoryKnowledgeRepository();
    embeddingProvider = new MockEmbeddingProvider();
    engine = new KnowledgeRetrievalEngine(repository, embeddingProvider);
  });

  describe("Schema and Metadata Validation", () => {
    it("detects invalid metadata and schema violations", () => {
      const invalidAsset: Partial<KnowledgeAsset> = {
        id: "invalid_id@",
        title: "A",
        content: "Short content",
        category: "NotACategory" as any,
        authority: "",
        language: "english",
        version: "1.a",
        lastUpdated: "invalid-date",
        priority: 99 as any,
        validityStatus: "Drafting" as any,
      };

      const result = validateKnowledgeAsset(invalidAsset);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const errorString = result.errors.join("; ");
      expect(errorString).toContain("alphanumeric");
      expect(errorString).toContain("Title must be at least");
      expect(errorString).toContain("Content is too short");
    });
  });

  describe("Retrieval Engine", () => {
    it("handles empty queries and missing knowledge gracefully", async () => {
      const result = await engine.retrieve({
        text: "quantum computing orbital launch",
        strategy: "HYBRID",
        minScore: 0.5,
      });

      expect(result.retrievedDocs.length).toBe(0);
      expect(result.formattedContextText).toContain("NO RELEVANT KNOWLEDGE BASE ENTRIES FOUND");
      expect(result.retrievalConfidence).toBe(0.0);
    });

    it("supports retrieving specific asset versions", async () => {
      const v1: KnowledgeAsset = {
        id: "sop-crowd-evac-test",
        title: "Emergency Evacuation Core Guidelines",
        category: KnowledgeCategory.EMERGENCY_PROCEDURES,
        authority: "FIFA Security Command",
        content: "This is Version 1.0 of our experimental evacuation procedure. Guide people out through Sector North.",
        language: "en",
        version: "1.0",
        lastUpdated: "2025-01-01T12:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["test", "evac"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [{ version: "1.0", timestamp: "2025-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }],
      };

      const v2: KnowledgeAsset = {
        ...v1,
        title: "Emergency Evacuation Core Guidelines Revised",
        content: "This is Version 2.0 of our evacuation guidelines. Evacuate people through Sector South and West.",
        version: "2.0",
        lastUpdated: "2026-01-01T12:00:00Z",
        auditHistory: [...v1.auditHistory, { version: "2.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "UPDATED" }],
      };

      await repository.save(v1);
      await repository.save(v2);

      const resultV1 = await engine.retrieve({
        text: "evacuation core guidelines",
        filter: { version: "1.0" },
      });

      expect(resultV1.retrievedDocs.length).toBeGreaterThan(0);
      expect(resultV1.retrievedDocs[0].asset.version).toBe("1.0");

      const resultV2 = await engine.retrieve({
        text: "evacuation core guidelines",
        filter: { version: "2.0" },
      });

      expect(resultV2.retrievedDocs.length).toBeGreaterThan(0);
      expect(resultV2.retrievedDocs[0].asset.version).toBe("2.0");

      await repository.delete("sop-crowd-evac-test");
    });

    it("resolves conflicting procedures using priority levels", async () => {
      const waitSop: KnowledgeAsset = {
        id: "sop-conflict-wait",
        title: "Standard Sector Wait Policy during Crowd Density Spikes",
        category: KnowledgeCategory.CROWD_MANAGEMENT,
        authority: "Crowd Safety Committee",
        content: "CONFL_TEST: If there is a massive crowd density spike, direct spectators to wait in their seats until queue decreases.",
        language: "en",
        version: "1.0",
        lastUpdated: "2026-01-01T12:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["confl_test", "density"],
        priority: KnowledgePriority.LOW,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [{ version: "1.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }],
      };

      const evacSop: KnowledgeAsset = {
        id: "sop-conflict-evac",
        title: "Immediate Stand Clearance in Extreme Congestion Emergencies",
        category: KnowledgeCategory.CROWD_MANAGEMENT,
        authority: "Stadium Security Command",
        content: "CONFL_TEST: In extreme crowd density spikes threatening physical safety, EVACUATE immediately to outer plazas.",
        language: "en",
        version: "1.0",
        lastUpdated: "2026-01-01T12:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["confl_test", "density"],
        priority: KnowledgePriority.CRITICAL,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [{ version: "1.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }],
      };

      await repository.save(waitSop);
      await repository.save(evacSop);

      const result = await engine.retrieve({
        text: "CONFL_TEST",
        strategy: "KEYWORD",
        limit: 2,
      });

      expect(result.retrievedDocs.length).toBeGreaterThanOrEqual(2);
      expect(result.retrievedDocs[0].asset.id).toBe("sop-conflict-evac");
      expect(result.retrievedDocs[1].asset.id).toBe("sop-conflict-wait");

      await repository.delete("sop-conflict-wait");
      await repository.delete("sop-conflict-evac");
    });

    it("distinguishes keyword, semantic, and hybrid retrieval strategies", async () => {
      const keywordResult = await engine.retrieve({
        text: "lightning strike mitigation Stand Clearance",
        strategy: "KEYWORD",
        limit: 1,
      });

      expect(keywordResult.retrievedDocs.length).toBeGreaterThan(0);
      expect(keywordResult.retrievedDocs[0].asset.id).toBe("sop-weather-lightning-strike");

      const hybridResult = await engine.retrieve({
        text: "lightning strike mitigation Stand Clearance",
        strategy: "HYBRID",
        limit: 1,
      });

      expect(hybridResult.retrievedDocs.length).toBeGreaterThan(0);
      expect(hybridResult.retrievedDocs[0].asset.id).toBe("sop-weather-lightning-strike");
      expect(hybridResult.retrievedDocs[0].score).toBeGreaterThan(0);
    });
  });
});
