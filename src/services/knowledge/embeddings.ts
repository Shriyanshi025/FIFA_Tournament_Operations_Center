/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmbeddingProvider } from "./types";
import { GoogleGenAI } from "@google/genai";

/**
 * Deterministic Mock Embedding Provider for offline tests, preventing live API calls
 * while maintaining vector shape and realistic mathematical comparison characteristics.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  public id = "mock-embeddings";
  public name = "Local Mock Embeddings";
  private dimensions = 128; // standard mock vector dimension

  /**
   * Generates a deterministic hash from text to build realistic, predictable mock vectors.
   */
  private textToVector(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const normalizedText = text.trim().toLowerCase();
    
    // Simple deterministic hash-driven vector generation
    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const index = (i * 7 + charCode * 3) % this.dimensions;
      vector[index] = (vector[index] + charCode / 255.0) / 2.0;
    }

    // Normalize vector to unit length so cosine similarity matches
    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1.0;
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = vector[i] / norm;
    }

    return vector;
  }

  public async embedQuery(text: string): Promise<number[]> {
    return this.textToVector(text);
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embedQuery(t)));
  }
}

/**
 * Official Google Gemini Embedding Provider using the @google/genai SDK.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  public id = "gemini-embeddings";
  public name = "Google Gemini Embeddings";
  private modelName: string;

  constructor(apiKey?: string, modelName = "text-embedding-004") {
    // API key is handled securely on the server-side proxy
    this.modelName = modelName;
  }

  public async embedQuery(text: string): Promise<number[]> {
    const fetchResponse = await fetch("/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        modelName: this.modelName
      })
    });

    if (!fetchResponse.ok) {
      throw new Error(`Embedding Proxy failure [Status ${fetchResponse.status}]: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    const embeddings = response.embeddings;
    if (!embeddings || embeddings.length === 0 || !embeddings[0].values) {
      throw new Error("Gemini API failed to return embedding values from server proxy.");
    }
    return embeddings[0].values;
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embedQuery(t)));
  }
}

/**
 * Calculates cosine similarity between two unit-normalized vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}
