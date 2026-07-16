/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { telemetry } from "../observability";
import { AIProvider } from "./types";
import { AIRuntimeError, AIErrorCode } from "./errors";

/**
 * Safely fetches environment variables from either process.env or import.meta.env,
 * supporting both client-side and server-side configurations with the VITE_ prefix fallback.
 */
function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name];
  }
  const viteName = `VITE_${name}`;
  if (typeof import.meta !== "undefined") {
    const meta = import.meta as any;
    if (meta.env) {
      return meta.env[name] || meta.env[viteName];
    }
  }
  return undefined;
}

/**
 * Adapter for Google Gemini Models using the official @google/genai SDK.
 */
export class GeminiProvider implements AIProvider {
  public id = "google-gemini";
  public name = "Google Gemini";
  public supportedModels = [
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite"
  ];
  public defaultModel = "gemini-3.5-flash";

  private client: GoogleGenAI | null = null;

  /**
   * Lazy initialization helper for the GoogleGenAI client.
   * Leverages environment variables and prevents initialization crashes.
   */
  private getClient(): GoogleGenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = getEnvVar("GEMINI_API_KEY");
    if (!apiKey) {
      throw new AIRuntimeError(
        AIErrorCode.ProviderUnavailable,
        "Gemini API key is missing. Please configure GEMINI_API_KEY in your environment."
      );
    }

    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    return this.client;
  }

  public async generate(
    promptText: string,
    options?: {
      model?: string;
      temperature?: number;
      responseMimeType?: string;
      timeoutMs?: number;
      signal?: AbortSignal;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }
  ): Promise<{ text: string; modelUsed: string; finishReason: string }> {
    const startTime = Date.now();
    const correlationId = Math.random().toString(36).substring(7);

    // 1. Parse and build configuration settings
    const modelToUse = options?.model || getEnvVar("GEMINI_MODEL_NAME") || this.defaultModel;
    if (!this.supportedModels.includes(modelToUse)) {
      throw new AIRuntimeError(
        AIErrorCode.ProviderUnavailable,
        `Unsupported Gemini model requested: ${modelToUse}`
      );
    }

    const envTemp = getEnvVar("GEMINI_TEMPERATURE");
    const temperature = options?.temperature ?? (envTemp ? parseFloat(envTemp) : undefined) ?? 0.2;

    const envMaxTokens = getEnvVar("GEMINI_MAX_TOKENS");
    const maxOutputTokens = envMaxTokens ? parseInt(envMaxTokens, 10) : 2048;

    // Parse safety settings
    let safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const envSafety = getEnvVar("GEMINI_SAFETY_SETTINGS");
    if (envSafety) {
      try {
        safetySettings = JSON.parse(envSafety);
      } catch (err) {
        console.warn(`[GeminiProvider] [${correlationId}] Failed to parse GEMINI_SAFETY_SETTINGS environment variable:`, err);
      }
    }

    // 2. Setup Priority mapping
    const priority = options?.priority || "MEDIUM";

    // 3. Execution limits (Timeout & Abort Controller)
    const envTimeout = getEnvVar("GEMINI_TIMEOUT_MS");
    const timeoutMs = options?.timeoutMs || (envTimeout ? parseInt(envTimeout, 10) : undefined);

    // 4. Retry strategy configuration
    const envMaxRetries = getEnvVar("GEMINI_MAX_RETRIES");
    const maxRetries = envMaxRetries ? parseInt(envMaxRetries, 10) : 0; // Default to 0, since AIRequestManager already handles retries

    let attempt = 0;
    while (true) {
      attempt++;
      const currentAttemptStartTime = Date.now();

      const controller = new AbortController();
      let timeoutId: any = null;

      // Propagate existing AbortSignal
      const onAbort = () => controller.abort();
      if (options?.signal) {
        options.signal.addEventListener("abort", onAbort);
        if (options.signal.aborted) {
          controller.abort();
        }
      }

      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);
      }

      try {
        console.log(
          `[GeminiProvider] [${correlationId}] Starting request execution: model=${modelToUse} priority=${priority} attempt=${attempt}/${maxRetries + 1}`
        );

        const ai = this.getClient();
        
        // Call official Google GenAI SDK
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: promptText,
          config: {
            temperature,
            maxOutputTokens,
            responseMimeType: options?.responseMimeType || "application/json",
            safetySettings,
            abortSignal: controller.signal,
          },
        });

        // Track duration of this specific attempt
        const executionDuration = Date.now() - currentAttemptStartTime;
        const totalDuration = Date.now() - startTime;

        // Cleanup abort listener and timeout
        if (options?.signal) {
          options.signal.removeEventListener("abort", onAbort);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Check if aborted/cancelled
        if (controller.signal.aborted || (options?.signal && options.signal.aborted)) {
          throw new AIRuntimeError(
            AIErrorCode.Timeout,
            "Execution was cancelled or timed out by the abort signal."
          );
        }

        // Extract usage metrics
        const tokens = response.usageMetadata;
        const promptTokens = tokens?.promptTokenCount ?? 0;
        const outputTokens = tokens?.candidatesTokenCount ?? 0;
        const totalTokens = tokens?.totalTokenCount ?? (promptTokens + outputTokens);

        // 5. Check safety blocks or empty candidates
        const candidates = response.candidates || [];
        const promptFeedback = response.promptFeedback;

        const isSafetyBlocked =
          (promptFeedback && (promptFeedback as any).blockReason) ||
          (candidates.length > 0 &&
            candidates.some(
              (c) =>
                c.finishReason === "SAFETY" ||
                (c as any).finish_reason === "SAFETY"
            ));

        if (isSafetyBlocked) {
          console.error(
            `[GeminiProvider] [${correlationId}] SAFETY BLOCK DETECTED: model=${modelToUse} promptFeedback=${JSON.stringify(
              promptFeedback
            )} candidates=${JSON.stringify(candidates)}`
          );
          throw new AIRuntimeError(
            AIErrorCode.UnsafeRecommendation,
            "The Gemini provider blocked the recommendation due to safety configurations.",
            { promptFeedback, candidates }
          );
        }

        if (candidates.length === 0) {
          console.error(
            `[GeminiProvider] [${correlationId}] EMPTY RESPONSE: model=${modelToUse} No candidates returned.`
          );
          throw new AIRuntimeError(
            AIErrorCode.ProviderUnavailable,
            "Gemini returned an empty response with no completion candidates."
          );
        }

        const rawText = response.text || "";
        if (rawText.trim().length === 0) {
          console.error(
            `[GeminiProvider] [${correlationId}] MALFORMED OUTPUT: model=${modelToUse} Response text was empty.`
          );
          throw new AIRuntimeError(
            AIErrorCode.ProviderUnavailable,
            "Gemini returned a blank text completion."
          );
        }

        const finishReason = candidates[0].finishReason || "STOP";

        // Successful response logging
        console.log(
          `[GeminiProvider] [${correlationId}] SUCCESS: latency=${executionDuration}ms totalLatency=${totalDuration}ms model=${modelToUse} promptTokens=${promptTokens} outputTokens=${outputTokens} totalTokens=${totalTokens} finishReason=${finishReason}`
        );

        telemetry.recordLatency("ai_request", totalDuration);
        telemetry.reportComponentStatus("GeminiProvider", "OK", totalDuration);
        telemetry.reportComponentStatus("AIRuntime", "OK", totalDuration);
        telemetry.log("INFO", "Gemini AI generation succeeded", {
          model: modelToUse,
          promptTokens,
          outputTokens,
          totalTokens,
          latencyMs: totalDuration,
        }, { correlationId });

        return {
          text: rawText,
          modelUsed: modelToUse,
          finishReason,
        };
      } catch (err: any) {
        // Cleanup abort listener and timeout
        if (options?.signal) {
          options.signal.removeEventListener("abort", onAbort);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const isTimeout =
          err.name === "AbortError" ||
          err.message?.includes("abort") ||
          err.message?.includes("timeout") ||
          controller.signal.aborted;

        // Translate the error to standard taxonomy
        let errorCode = AIErrorCode.ProviderUnavailable;
        let errorMsg = err.message || "Unknown Gemini SDK error.";

        if (isTimeout) {
          errorCode = AIErrorCode.Timeout;
          errorMsg = "Gemini request timed out or was cancelled.";
        } else if (
          err.message?.includes("429") ||
          err.message?.includes("Quota") ||
          err.message?.includes("ResourceExhausted") ||
          err.message?.toLowerCase().includes("rate limit")
        ) {
          errorCode = AIErrorCode.RateLimited;
          errorMsg = "Gemini API rate limit exceeded.";
        } else if (err.code === AIErrorCode.UnsafeRecommendation) {
          errorCode = AIErrorCode.UnsafeRecommendation;
          errorMsg = err.message;
        }

        const runtimeError = new AIRuntimeError(errorCode, errorMsg, err);

        console.error(
          `[GeminiProvider] [${correlationId}] FAILURE: attempt=${attempt}/${maxRetries + 1} duration=${Date.now() - currentAttemptStartTime}ms error=${err.message} mappedCode=${errorCode}`
        );

        const latency = Date.now() - startTime;
        telemetry.reportComponentStatus("GeminiProvider", "FAILING", latency, err.message || "Unknown error");
        telemetry.reportComponentStatus("AIRuntime", "DEGRADED", latency, "Gemini provider is failing.");
        telemetry.log("ERROR", `Gemini API invocation failed: ${err.message || "Unknown error"}`, {
          attempt,
          errorCode,
          latencyMs: latency,
        }, { correlationId });

        // Retry if applicable and retryable
        const isRetryable =
          isTimeout ||
          errorCode === AIErrorCode.RateLimited ||
          err.status >= 500 ||
          err.message?.includes("fetch failed");

        if (attempt <= maxRetries && isRetryable) {
          const backoff = Math.pow(2, attempt) * 500;
          console.log(`[GeminiProvider] [${correlationId}] Retrying in ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        throw runtimeError;
      }
    }
  }
}

/**
 * Adapter for OpenAI GPT Models.
 */
export class OpenAIProvider implements AIProvider {
  public id = "openai";
  public name = "OpenAI GPT";
  public supportedModels = ["gpt-4o", "gpt-4o-mini", "o1-mini"];
  public defaultModel = "gpt-4o";

  public async generate(
    promptText: string,
    options?: { model?: string; temperature?: number; responseMimeType?: string; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ text: string; modelUsed: string; finishReason: string }> {
    const modelToUse = options?.model || this.defaultModel;

    const mockJson = JSON.stringify({
      recommendationId: `REC-GPT-${Math.floor(Math.random() * 10000)}`,
      title: "OpenAI Smart Crowding Dispatch",
      action: "Dispatch security patrol team S-2 to Concourse A-East sector.",
      estimatedEffectMinutes: 8,
      confidenceScore: 0.94,
      rationale: "Rivalry match profiles suggest heightened friction risk. Pre-emptive presence advised."
    });

    return {
      text: mockJson,
      modelUsed: modelToUse,
      finishReason: "STOP"
    };
  }
}

/**
 * Adapter for Anthropic Claude Models.
 */
export class AnthropicClaudeProvider implements AIProvider {
  public id = "anthropic-claude";
  public name = "Anthropic Claude";
  public supportedModels = ["claude-3-5-sonnet", "claude-3-haiku"];
  public defaultModel = "claude-3-5-sonnet";

  public async generate(
    promptText: string,
    options?: { model?: string; temperature?: number; responseMimeType?: string; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ text: string; modelUsed: string; finishReason: string }> {
    const modelToUse = options?.model || this.defaultModel;

    const mockJson = JSON.stringify({
      recommendationId: `REC-CLD-${Math.floor(Math.random() * 10000)}`,
      title: "Claude Thermal Mitigation Directive",
      action: "Activate auxiliary fans and deploy hydration stations around Southwest Sector.",
      estimatedEffectMinutes: 15,
      confidenceScore: 0.85,
      rationale: "Ambient temp 39°C exceeds safe baseline. Hydration protocol E-2 triggers immediately."
    });

    return {
      text: mockJson,
      modelUsed: modelToUse,
      finishReason: "STOP"
    };
  }
}

/**
 * Adapter for Azure OpenAI Service.
 */
export class AzureOpenAIProvider implements AIProvider {
  public id = "azure-openai";
  public name = "Azure OpenAI Service";
  public supportedModels = ["azure-gpt-4o", "azure-gpt-35-turbo"];
  public defaultModel = "azure-gpt-4o";

  public async generate(
    promptText: string,
    options?: { model?: string; temperature?: number; responseMimeType?: string; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ text: string; modelUsed: string; finishReason: string }> {
    const modelToUse = options?.model || this.defaultModel;

    const mockJson = JSON.stringify({
      recommendationId: `REC-AZ-${Math.floor(Math.random() * 10000)}`,
      title: "Azure Enterprise Evac Routing",
      action: "Override south gate locks and deploy physical guide stewards.",
      estimatedEffectMinutes: 5,
      confidenceScore: 0.97,
      rationale: "Automatic fail-safe evacuation override activated based on sensor triggers."
    });

    return {
      text: mockJson,
      modelUsed: modelToUse,
      finishReason: "STOP"
    };
  }
}

/**
 * Adapter for local offline deployment models (e.g., Llama.cpp, Ollama, ONNX).
 */
export class LocalModelProvider implements AIProvider {
  public id = "local-model";
  public name = "Local Hardware Inference";
  public supportedModels = ["llama-3-8b-instruct", "mistral-7b-instruct"];
  public defaultModel = "llama-3-8b-instruct";

  public async generate(
    promptText: string,
    options?: { model?: string; temperature?: number; responseMimeType?: string; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<{ text: string; modelUsed: string; finishReason: string }> {
    const modelToUse = options?.model || this.defaultModel;

    const mockJson = JSON.stringify({
      recommendationId: `REC-LOC-${Math.floor(Math.random() * 10000)}`,
      title: "Local Offline Backup Protocol",
      action: "Trigger radio announcement alerts to staff regarding metro delays.",
      estimatedEffectMinutes: 20,
      confidenceScore: 0.76,
      rationale: "In-stadium edge servers running fallback evaluation model with restricted internet context."
    });

    return {
      text: mockJson,
      modelUsed: modelToUse,
      finishReason: "STOP"
    };
  }
}
