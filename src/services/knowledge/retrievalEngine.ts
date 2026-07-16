/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KnowledgeRepository,
  EmbeddingProvider,
  RetrievalQuery,
  RAGContext,
  RetrievedDoc,
  KnowledgeAsset
} from "./types";
import { cosineSimilarity } from "./embeddings";
import { telemetry } from "../observability";

export class KnowledgeRetrievalEngine {
  private repository: KnowledgeRepository;
  private embeddingProvider: EmbeddingProvider;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(repository: KnowledgeRepository, embeddingProvider: EmbeddingProvider) {
    this.repository = repository;
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Helper to compute a normalized keyword matching score.
   * Matches terms in the query with terms in the target text.
   */
  private calculateKeywordScore(asset: KnowledgeAsset, query: string): number {
    const queryTerms = query.toLowerCase().split(/\W+/).filter(q => q.length > 1);
    if (queryTerms.length === 0) return 0.0;

    const titleLower = asset.title.toLowerCase();
    const contentLower = asset.content.toLowerCase();
    const tagsLower = asset.tags.map(t => t.toLowerCase());

    let matchCount = 0;
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        matchCount += 1.0; // High weight for title matches
      } else if (tagsLower.includes(term)) {
        matchCount += 0.8; // Medium weight for exact tag matches
      } else if (contentLower.includes(term)) {
        matchCount += 0.4; // Standard weight for content match
      }
    }

    // Normalize score to 0.0 - 1.0 range
    const rawScore = matchCount / queryTerms.length;
    return Math.min(rawScore, 1.0);
  }

  /**
   * Retrieves an asset's vector embedding. Reads from memory cache if already computed.
   */
  private async getOrCreateAssetEmbedding(asset: KnowledgeAsset): Promise<number[]> {
    const cacheKey = `${asset.id}@${asset.version}`;
    let vector = this.embeddingCache.get(cacheKey);
    if (!vector) {
      vector = await this.embeddingProvider.embedQuery(asset.content);
      this.embeddingCache.set(cacheKey, vector);
    }
    return vector;
  }

  /**
   * Executes the full RAG retrieval pipeline:
   * Query -> Filter -> Strategy Scoring -> Ranking -> Packaging
   */
  public async retrieve(query: RetrievalQuery): Promise<RAGContext> {
    const endMeasure = telemetry.startTimer("knowledge_retrieval");
    const startTime = Date.now();
    const limit = query.limit ?? 3;
    const minScore = query.minScore ?? 0.15;
    const strategy = query.strategy ?? "HYBRID";

    // 1. Fetch matching documents using the filter from repository
    const filteredAssets = await this.repository.search("", query.filter);

    if (filteredAssets.length === 0 || !query.text || query.text.trim() === "") {
      // Empty query or no docs found matching metadata filters
      const emptyResults: RetrievedDoc[] = filteredAssets.slice(0, limit).map(asset => ({
        asset,
        score: 1.0, // Default score if no query text was provided but filters matched
        strategyUsed: strategy
      }));

      const elapsed = endMeasure();
      telemetry.reportComponentStatus("KnowledgeLayer", "OK", elapsed);
      telemetry.log("INFO", "RAG query returned no results, fallback to empty context.", {
        queryText: query.text,
        limit,
        durationMs: elapsed
      });

      return {
        formattedContextText: this.packageContextText(emptyResults),
        retrievedDocs: emptyResults,
        pipelineDurationMs: Date.now() - startTime,
        retrievalConfidence: emptyResults.length > 0 ? 0.70 : 0.0
      };
    }

    const retrievedDocs: RetrievedDoc[] = [];

    // 2. Pre-embed query if semantic or hybrid strategies are requested
    let queryVector: number[] = [];
    if (strategy === "SEMANTIC" || strategy === "HYBRID") {
      try {
        queryVector = await this.embeddingProvider.embedQuery(query.text);
      } catch (err) {
        console.warn("[KnowledgeRetrievalEngine] Embedding provider failed, falling back to KEYWORD scoring.", err);
      }
    }

    // 3. Compute relevance scores based on selected strategy
    for (const asset of filteredAssets) {
      let score = 0;
      let actualStrategy = strategy;

      const keywordScore = this.calculateKeywordScore(asset, query.text);

      if (strategy === "KEYWORD" || queryVector.length === 0) {
        score = keywordScore;
        actualStrategy = "KEYWORD";
      } else if (strategy === "SEMANTIC") {
        try {
          const docVector = await this.getOrCreateAssetEmbedding(asset);
          score = cosineSimilarity(queryVector, docVector);
        } catch (err) {
          console.warn(`[KnowledgeRetrievalEngine] Failed to embed asset ${asset.id}, falling back to keyword score.`, err);
          score = keywordScore;
          actualStrategy = "KEYWORD";
        }
      } else {
        // HYBRID: 40% Keyword, 60% Semantic
        try {
          const docVector = await this.getOrCreateAssetEmbedding(asset);
          const semanticScore = cosineSimilarity(queryVector, docVector);
          score = (0.4 * keywordScore) + (0.6 * semanticScore);
        } catch (err) {
          console.warn(`[KnowledgeRetrievalEngine] Hybrid fallback on asset ${asset.id} due to embedding error.`, err);
          score = keywordScore;
          actualStrategy = "KEYWORD";
        }
      }

      // Filter by minScore threshold
      if (score >= minScore) {
        retrievedDocs.push({
          asset,
          score: Number(score.toFixed(4)),
          strategyUsed: actualStrategy
        });
      }
    }

    // 4. Sort results (Descending by score, then priority)
    retrievedDocs.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.001) {
        return b.asset.priority - a.asset.priority; // secondary sort by priority
      }
      return b.score - a.score;
    });

    // 5. Slice to requested limit
    const slicedDocs = retrievedDocs.slice(0, limit);

    // 6. Calculate overall retrieval confidence score
    let retrievalConfidence = 0.0;
    if (slicedDocs.length > 0) {
      const topScore = slicedDocs[0].score;
      const averageScore = slicedDocs.reduce((acc, d) => acc + d.score, 0) / slicedDocs.length;
      retrievalConfidence = Number((topScore * 0.8 + averageScore * 0.2).toFixed(4));
    }

    const elapsedTotal = endMeasure();
    telemetry.reportComponentStatus("KnowledgeLayer", "OK", elapsedTotal);
    telemetry.log("INFO", "RAG knowledge retrieval completed successfully.", {
      queryText: query.text,
      docsCount: slicedDocs.length,
      confidence: retrievalConfidence,
      durationMs: elapsedTotal
    });

    return {
      formattedContextText: this.packageContextText(slicedDocs),
      retrievedDocs: slicedDocs,
      pipelineDurationMs: Date.now() - startTime,
      retrievalConfidence
    };
  }

  /**
   * Formats the retrieved documents list into a pristine, structured XML/markdown context payload.
   */
  private packageContextText(docs: RetrievedDoc[]): string {
    if (docs.length === 0) {
      return "NO RELEVANT KNOWLEDGE BASE ENTRIES FOUND FOR THE ACTIVE SITUATION.";
    }

    let output = "--- VERIFIED KNOWLEDGE LAYER PROCEDURES --- \n";
    output += "The following standard operating procedures (SOPs) and emergency protocols have been retrieved from the official FIFA Tournament operations database.\n\n";

    docs.forEach((doc, idx) => {
      const a = doc.asset;
      output += `[DOCUMENT ${idx + 1} of ${docs.length}]\n`;
      output += `ID: ${a.id}\n`;
      output += `Title: ${a.title}\n`;
      output += `Category: ${a.category}\n`;
      output += `Authority: ${a.authority}\n`;
      output += `Version: ${a.version} (Last Updated: ${a.lastUpdated})\n`;
      output += `Relevance Score: ${doc.score} (Via ${doc.strategyUsed} Search)\n`;
      output += `Content:\n`;
      output += `${a.content.trim()}\n`;
      output += `-------------------------------------------\n\n`;
    });

    return output.trim();
  }
}
