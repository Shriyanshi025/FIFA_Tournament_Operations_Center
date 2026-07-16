/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiProvider } from "../providers";
import { AIRuntimeError, AIErrorCode } from "../errors";

/**
 * Lightweight, self-contained test runner for automated provider unit tests.
 * Can be run via tsx in Node.js.
 */
async function runTests() {
  console.log("=== STARTING GEMINI PROVIDER UNIT TESTS ===");
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

  // Save current env
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL_NAME;
  const originalMaxRetries = process.env.GEMINI_MAX_RETRIES;

  // --- TEST 1: Lazy Initialization & Missing API Key Connection Lifecycle ---
  await test("Connection Lifecycle - Missing API Key throws ProviderUnavailable", async () => {
    // Clear API key from env to trigger error
    delete process.env.GEMINI_API_KEY;
    
    const provider = new GeminiProvider();
    
    try {
      await provider.generate("test prompt");
      throw new Error("Expected generate to throw but it succeeded.");
    } catch (err: any) {
      if (err instanceof AIRuntimeError && err.code === AIErrorCode.ProviderUnavailable) {
        // Correctly threw ProviderUnavailable!
      } else {
        throw new Error(`Expected ProviderUnavailable error, got: ${err.message}`);
      }
    } finally {
      // Restore
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  // --- TEST 2: Successful Request Execution & Normalization ---
  await test("Request Execution - Normalizes successful API response with token tracking", async () => {
    const provider = new GeminiProvider();
    
    // Inject mock client to prevent real API call
    const mockResponse = {
      text: '{"status": "ok"}',
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: '{"status": "ok"}' }] }
        }
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 15,
        totalTokenCount: 25
      }
    };

    const mockClient = {
      models: {
        generateContent: async (args: any) => {
          return mockResponse;
        }
      }
    };

    (provider as any).client = mockClient;

    const result = await provider.generate("Give me stadium recommendations");
    
    if (result.text !== '{"status": "ok"}') {
      throw new Error(`Expected returned text to match mock JSON, got: ${result.text}`);
    }
    if (result.modelUsed !== "gemini-3.5-flash") {
      throw new Error(`Expected default model to be used, got: ${result.modelUsed}`);
    }
    if (result.finishReason !== "STOP") {
      throw new Error(`Expected finishReason to be STOP, got: ${result.finishReason}`);
    }
  });

  // --- TEST 3: Safety Block Response Handling ---
  await test("Safety - Correctly handles and translates content blocks into UnsafeRecommendation", async () => {
    const provider = new GeminiProvider();
    
    const mockBlockedResponse = {
      candidates: [
        {
          finishReason: "SAFETY",
          content: { parts: [] }
        }
      ],
      promptFeedback: {
        blockReason: "SAFETY"
      }
    };

    const mockClient = {
      models: {
        generateContent: async () => mockBlockedResponse
      }
    };

    (provider as any).client = mockClient;

    try {
      await provider.generate("Unsafe query");
      throw new Error("Expected generate to be blocked, but it completed.");
    } catch (err: any) {
      if (err instanceof AIRuntimeError && err.code === AIErrorCode.UnsafeRecommendation) {
        // Success
      } else {
        throw new Error(`Expected UnsafeRecommendation error, got code: ${err.code}, msg: ${err.message}`);
      }
    }
  });

  // --- TEST 4: Quota Failure / Rate Limiting Translation ---
  await test("Safety - Maps ResourceExhausted (429) errors into RateLimited", async () => {
    const provider = new GeminiProvider();
    
    const mockClient = {
      models: {
        generateContent: async () => {
          const quotaError = new Error("Resource has been exhausted (e.g. 429 Rate Limit exceeded).");
          (quotaError as any).status = 429;
          throw quotaError;
        }
      }
    };

    (provider as any).client = mockClient;

    try {
      await provider.generate("test");
      throw new Error("Expected rate limit exception but succeeded.");
    } catch (err: any) {
      if (err instanceof AIRuntimeError && err.code === AIErrorCode.RateLimited) {
        // Success
      } else {
        throw new Error(`Expected RateLimited error code, got: ${err.code}`);
      }
    }
  });

  // --- TEST 5: Timeout & Cancellation via AbortSignal ---
  await test("Cancellation - Correctly aborts execution when AbortSignal triggers", async () => {
    const provider = new GeminiProvider();
    
    const mockClient = {
      models: {
        generateContent: async (args: any) => {
          // Simulate latency and abort
          return new Promise((resolve, reject) => {
            const onAbort = () => reject(new Error("Request aborted."));
            if (args.config?.abortSignal) {
              args.config.abortSignal.addEventListener("abort", onAbort);
            }
          });
        }
      }
    };

    (provider as any).client = mockClient;

    const controller = new AbortController();
    const promise = provider.generate("long running prompt", { signal: controller.signal });
    
    // Immediately abort
    controller.abort();

    try {
      await promise;
      throw new Error("Expected aborted promise to fail but succeeded.");
    } catch (err: any) {
      if (err instanceof AIRuntimeError && err.code === AIErrorCode.Timeout) {
        // Success
      } else {
        throw new Error(`Expected Timeout error code on cancellation, got: ${err.code}`);
      }
    }
  });

  // --- TEST 6: Provider Internal Retry Strategy ---
  await test("Retry Strategy - Transient errors are retried with exponential backoff", async () => {
    process.env.GEMINI_MAX_RETRIES = "1"; // Allow 1 retry
    const provider = new GeminiProvider();
    
    let calls = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          calls++;
          if (calls === 1) {
            // First call fails with transient network error
            throw new Error("fetch failed - DNS temporary error");
          }
          // Second call succeeds
          return {
            text: "Recovery output",
            candidates: [{ finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 }
          };
        }
      }
    };

    (provider as any).client = mockClient;

    const result = await provider.generate("Recoverable query");
    
    if (calls !== 2) {
      throw new Error(`Expected 2 generate calls due to 1 failure and retry, got: ${calls}`);
    }
    if (result.text !== "Recovery output") {
      throw new Error(`Expected recovered response text, got: ${result.text}`);
    }
  });

  // Restore env
  process.env.GEMINI_API_KEY = originalApiKey;
  process.env.GEMINI_MODEL_NAME = originalModel;
  process.env.GEMINI_MAX_RETRIES = originalMaxRetries;

  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
    process.exit(0);
  }
}

// Execute the tests if run directly
runTests().catch(err => {
  console.error("Unhandle test runner error:", err);
  process.exit(1);
});
