/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GeminiProvider,
  OpenAIProvider,
  AnthropicClaudeProvider,
  AzureOpenAIProvider,
  LocalModelProvider,
} from "../providers";
import { AIRuntimeError, AIErrorCode } from "../errors";

describe("AI Providers Unit & Integration Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("GeminiProvider", () => {
    it("throws ProviderUnavailable error when GEMINI_API_KEY is missing during getClient", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.VITE_GEMINI_API_KEY;

      const provider = new GeminiProvider();

      expect(() => (provider as any).getClient()).toThrow(AIRuntimeError);
      try {
        (provider as any).getClient();
      } catch (err: any) {
        expect(err.code).toBe(AIErrorCode.ProviderUnavailable);
        expect(err.message).toContain("Gemini API key is missing");
      }
    });

    it("successfully normalizes valid backend proxy responses", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      const provider = new GeminiProvider();

      const mockResponse = {
        text: '{"status": "ok", "recommendation": "Deploy unit A"}',
        candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"status": "ok"}' }] } }],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 20, totalTokenCount: 32 },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        })
      );

      const result = await provider.generate("Evaluate Gate A flow");

      expect(result.text).toBe('{"status": "ok", "recommendation": "Deploy unit A"}');
      expect(result.modelUsed).toBe("gemini-2.5-flash");
      expect(result.finishReason).toBe("STOP");
    });

    it("handles safety blocks and translates finishReason SAFETY into UnsafeRecommendation", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      const provider = new GeminiProvider();

      const mockBlockedResponse = {
        candidates: [{ finishReason: "SAFETY", content: { parts: [] } }],
        promptFeedback: { blockReason: "SAFETY" },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockBlockedResponse,
        })
      );

      await expect(provider.generate("Generate hostile directive")).rejects.toThrow(
        AIRuntimeError
      );

      try {
        await provider.generate("Generate hostile directive");
      } catch (err: any) {
        expect(err.code).toBe(AIErrorCode.UnsafeRecommendation);
        expect(err.message).toContain("blocked the recommendation due to safety");
      }
    });

    it("translates 429 Rate Limit HTTP responses into RateLimited AIErrorCode", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      const provider = new GeminiProvider();

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          statusText: "Too Many Requests - Quota Exhausted",
        })
      );

      await expect(provider.generate("Heavy prompt")).rejects.toThrow(AIRuntimeError);

      try {
        await provider.generate("Heavy prompt");
      } catch (err: any) {
        expect(err.code).toBe(AIErrorCode.RateLimited);
        expect(err.message).toContain("rate limit exceeded");
      }
    });

    it("supports AbortSignal cancellation and converts signal abort into Timeout error", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      const provider = new GeminiProvider();

      const controller = new AbortController();

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((_url: string, options: any) => {
          return new Promise((_resolve, reject) => {
            if (options?.signal) {
              options.signal.addEventListener("abort", () => {
                const err = new Error("The operation was aborted");
                err.name = "AbortError";
                reject(err);
              });
            }
          });
        })
      );

      const generatePromise = provider.generate("Long operation", {
        signal: controller.signal,
      });

      controller.abort();

      await expect(generatePromise).rejects.toThrow(AIRuntimeError);

      try {
        await generatePromise;
      } catch (err: any) {
        expect(err.code).toBe(AIErrorCode.Timeout);
      }
    });

    it("handles network failure retries with exponential backoff", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      process.env.GEMINI_MAX_RETRIES = "1";

      const provider = new GeminiProvider();
      let callCount = 0;

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error("fetch failed - Network connection reset");
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({
              text: "Success after retry",
              candidates: [{ finishReason: "STOP" }],
            }),
          };
        })
      );

      const result = await provider.generate("Retry test");

      expect(callCount).toBe(2);
      expect(result.text).toBe("Success after retry");
    });

    it("throws ProviderUnavailable for empty candidates or blank output", async () => {
      process.env.GEMINI_API_KEY = "test-api-key";
      const provider = new GeminiProvider();

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ candidates: [] }),
        })
      );

      await expect(provider.generate("Empty candidates query")).rejects.toThrow(AIRuntimeError);
    });
  });

  describe("Alternative AI Providers", () => {
    it("OpenAIProvider returns formatted mock JSON recommendation", async () => {
      const provider = new OpenAIProvider();
      expect(provider.id).toBe("openai");
      expect(provider.supportedModels).toContain("gpt-4o");

      const result = await provider.generate("Prompt for OpenAI");
      expect(result.modelUsed).toBe("gpt-4o");
      expect(result.finishReason).toBe("STOP");

      const parsed = JSON.parse(result.text);
      expect(parsed.title).toBeDefined();
      expect(parsed.action).toBeDefined();
    });

    it("AnthropicClaudeProvider returns formatted mock JSON recommendation", async () => {
      const provider = new AnthropicClaudeProvider();
      expect(provider.id).toBe("anthropic-claude");

      const result = await provider.generate("Prompt for Claude");
      expect(result.modelUsed).toBe("claude-3-5-sonnet");

      const parsed = JSON.parse(result.text);
      expect(parsed.title).toContain("Claude");
    });

    it("AzureOpenAIProvider returns formatted mock JSON recommendation", async () => {
      const provider = new AzureOpenAIProvider();
      expect(provider.id).toBe("azure-openai");

      const result = await provider.generate("Prompt for Azure");
      expect(result.modelUsed).toBe("azure-gpt-4o");

      const parsed = JSON.parse(result.text);
      expect(parsed.title).toContain("Azure");
    });

    it("LocalModelProvider returns formatted mock JSON recommendation for offline fallback", async () => {
      const provider = new LocalModelProvider();
      expect(provider.id).toBe("local-model");

      const result = await provider.generate("Offline prompt");
      expect(result.modelUsed).toBe("llama-3-8b-instruct");

      const parsed = JSON.parse(result.text);
      expect(parsed.title).toContain("Local Offline");
    });
  });
});
