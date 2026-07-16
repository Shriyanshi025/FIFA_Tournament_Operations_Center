/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryKnowledgeRepository } from "../repository";
import { MockEmbeddingProvider } from "../embeddings";
import { KnowledgeRetrievalEngine } from "../retrievalEngine";
import { validateKnowledgeAsset } from "../validation";
import { KnowledgeCategory, KnowledgeStatus, KnowledgePriority, KnowledgeAsset } from "../types";

async function runKnowledgeTests() {
  console.log("=== STARTING KNOWLEDGE LAYER & RAG TESTS ===");
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

  const repository = new InMemoryKnowledgeRepository();
  const embeddingProvider = new MockEmbeddingProvider();
  const engine = new KnowledgeRetrievalEngine(repository, embeddingProvider);

  // --- TEST 1: Schema and Metadata Validation ---
  await test("Validation - Detects invalid metadata and schema violations", async () => {
    const invalidAsset: Partial<KnowledgeAsset> = {
      id: "invalid_id@", // Bad character
      title: "A",       // Title too short (< 5)
      content: "Short content", // Content too short (< 20)
      category: "NotACategory" as any, // Invalid enum value
      authority: "", // Empty authority
      language: "english", // Not a 2-letter code
      version: "1.a", // Invalid semantic version
      lastUpdated: "invalid-date",
      priority: 99 as any, // Invalid priority
      validityStatus: "Drafting" as any // Invalid status
    };

    const result = validateKnowledgeAsset(invalidAsset);
    if (result.isValid) {
      throw new Error("Expected validation to fail for malformed metadata, but it passed.");
    }
    
    // Ensure all errors are captured
    const errorString = result.errors.join("; ");
    if (!errorString.includes("alphanumeric")) throw new Error("Missing ID error");
    if (!errorString.includes("Title must be at least")) throw new Error("Missing Title error");
    if (!errorString.includes("Content is too short")) throw new Error("Missing Content error");
    if (!errorString.includes("approved tournament domains")) throw new Error("Missing Category error");
    if (!errorString.includes("ISO 639-1")) throw new Error("Missing Language error");
    if (!errorString.includes("semantic format")) throw new Error("Missing Version error");
    if (!errorString.includes("ISO 8601")) throw new Error("Missing Date error");
    if (!errorString.includes("numerical enum")) throw new Error("Missing Priority error");
  });

  // --- TEST 2: Empty / Missing Knowledge Search ---
  await test("Retrieval - Handles empty queries and missing knowledge gracefully", async () => {
    // Search for a query that has no semantic or keyword relationship with seeded SOPs
    const result = await engine.retrieve({
      text: "quantum computing orbital launch",
      strategy: "HYBRID",
      minScore: 0.5 // High threshold to filter out unrelated docs
    });

    if (result.retrievedDocs.length !== 0) {
      throw new Error(`Expected 0 documents retrieved for irrelevant query, got: ${result.retrievedDocs.length}`);
    }
    if (!result.formattedContextText.includes("NO RELEVANT KNOWLEDGE BASE ENTRIES FOUND")) {
      throw new Error("Formatted text should notify that no entries were found.");
    }
    if (result.retrievalConfidence !== 0.0) {
      throw new Error(`Expected confidence to be 0.0, got: ${result.retrievalConfidence}`);
    }
  });

  // --- TEST 3: Multiple Versions Filtering ---
  await test("Versioning - Supports retrieving specific asset versions", async () => {
    // Create version 1.0 of evacuation procedure
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
      auditHistory: [{ version: "1.0", timestamp: "2025-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }]
    };

    // Create version 2.0 of evacuation procedure
    const v2: KnowledgeAsset = {
      ...v1,
      title: "Emergency Evacuation Core Guidelines Revised",
      content: "This is Version 2.0 of our evacuation guidelines. Evacuate people through Sector South and West.",
      version: "2.0",
      lastUpdated: "2026-01-01T12:00:00Z",
      auditHistory: [...v1.auditHistory, { version: "2.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "UPDATED" }]
    };

    await repository.save(v1);
    await repository.save(v2);

    // Retrieve version 1.0 specifically
    const resultV1 = await engine.retrieve({
      text: "evacuation core guidelines",
      filter: { version: "1.0" }
    });

    if (resultV1.retrievedDocs.length === 0) {
      throw new Error("Failed to retrieve version 1.0.");
    }
    if (resultV1.retrievedDocs[0].asset.version !== "1.0") {
      throw new Error(`Expected version 1.0, got: ${resultV1.retrievedDocs[0].asset.version}`);
    }

    // Retrieve version 2.0 specifically
    const resultV2 = await engine.retrieve({
      text: "evacuation core guidelines",
      filter: { version: "2.0" }
    });

    if (resultV2.retrievedDocs.length === 0) {
      throw new Error("Failed to retrieve version 2.0.");
    }
    if (resultV2.retrievedDocs[0].asset.version !== "2.0") {
      throw new Error(`Expected version 2.0, got: ${resultV2.retrievedDocs[0].asset.version}`);
    }

    // Clean up
    await repository.delete("sop-crowd-evac-test");
  });

  // --- TEST 4: Conflicting Procedures & Priority Resolution ---
  await test("Conflicts & Ranking - Resolves conflicting procedures using Priority Levels", async () => {
    // SOP 1: Low Priority telling people to wait
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
      priority: KnowledgePriority.LOW, // Low Priority
      validityStatus: KnowledgeStatus.PUBLISHED,
      auditHistory: [{ version: "1.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }]
    };

    // SOP 2: Critical Priority emergency telling people to evacuate immediately
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
      priority: KnowledgePriority.CRITICAL, // Critical Priority
      validityStatus: KnowledgeStatus.PUBLISHED,
      auditHistory: [{ version: "1.0", timestamp: "2026-01-01T12:00:00Z", actor: "Tester", action: "CREATED" }]
    };

    await repository.save(waitSop);
    await repository.save(evacSop);

    // Search with a query matching both documents equally
    const result = await engine.retrieve({
      text: "CONFL_TEST",
      strategy: "KEYWORD",
      limit: 2
    });

    if (result.retrievedDocs.length < 2) {
      throw new Error(`Expected at least 2 matching documents, got: ${result.retrievedDocs.length}`);
    }

    // Since they both match the query text identically, the sorting should fall back to PRIORITY ordering (descending).
    // Therefore, the CRITICAL evacSop should rank #1, and LOW waitSop should rank #2.
    const firstDoc = result.retrievedDocs[0];
    const secondDoc = result.retrievedDocs[1];

    if (firstDoc.asset.id !== "sop-conflict-evac") {
      throw new Error(`Priority ranking failed! Expected 'sop-conflict-evac' (CRITICAL) to be ranked first, got: ${firstDoc.asset.id}`);
    }
    if (secondDoc.asset.id !== "sop-conflict-wait") {
      throw new Error(`Priority ranking failed! Expected 'sop-conflict-wait' (LOW) to be ranked second, got: ${secondDoc.asset.id}`);
    }

    // Clean up
    await repository.delete("sop-conflict-wait");
    await repository.delete("sop-conflict-evac");
  });

  // --- TEST 5: Retrieval Quality (Keyword vs Semantic vs Hybrid) ---
  await test("Ranking Quality - Verifies keyword, semantic and hybrid search distinctions", async () => {
    // Perform keyword search for "lightning"
    const keywordResult = await engine.retrieve({
      text: "lightning strike mitigation Stand Clearance",
      strategy: "KEYWORD",
      limit: 1
    });

    if (keywordResult.retrievedDocs.length === 0) {
      throw new Error("Keyword search for lightning failed.");
    }
    if (keywordResult.retrievedDocs[0].asset.id !== "sop-weather-lightning-strike") {
      throw new Error(`Expected lightning strike SOP to rank highest, got: ${keywordResult.retrievedDocs[0].asset.id}`);
    }

    // Perform hybrid search to ensure combined scores and caching work correctly
    const hybridResult = await engine.retrieve({
      text: "lightning strike mitigation Stand Clearance",
      strategy: "HYBRID",
      limit: 1
    });

    if (hybridResult.retrievedDocs.length === 0) {
      throw new Error("Hybrid search for lightning failed.");
    }
    if (hybridResult.retrievedDocs[0].asset.id !== "sop-weather-lightning-strike") {
      throw new Error(`Expected lightning strike SOP for hybrid search, got: ${hybridResult.retrievedDocs[0].asset.id}`);
    }
    if (hybridResult.retrievedDocs[0].score === 0) {
      throw new Error("Relevance score should not be 0.");
    }
  });

  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("KNOWLEDGE LAYER COMPLETED ALL TESTS SUCCESSFULLY! 🎉");
    process.exit(0);
  }
}

runKnowledgeTests().catch(err => {
  console.error("Knowledge test runner crashed:", err);
  process.exit(1);
});
