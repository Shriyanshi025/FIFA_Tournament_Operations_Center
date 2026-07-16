/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AIProvider, 
  AIRequestContext, 
  AIRequestOptions, 
  AIResponse, 
  AIAuditEntry 
} from "./types";
import { AIRuntimeError, AIErrorCode } from "./errors";
import { ContextBuilder } from "./contextBuilder";
import { PromptRegistry } from "./promptRegistry";
import { GeminiProvider, OpenAIProvider, AnthropicClaudeProvider, AzureOpenAIProvider, LocalModelProvider } from "./providers";
import { JSONValidator } from "./validation";
import { ConfidenceEngine } from "./confidence";
import { AIAuditLayer } from "./audit";

export enum AIRequestState {
  QUEUED = "QUEUED",
  EXECUTING = "EXECUTING",
  VALIDATING = "VALIDATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

interface QueueItem {
  id: string;
  options: AIRequestOptions;
  provider: AIProvider;
  priority: number; // Numeric mapping of priority
  resolve: (value: AIResponse<any>) => void;
  reject: (reason: any) => void;
  state: AIRequestState;
  createdAt: number;
}

export class AIRequestManager {
  private static instance: AIRequestManager | null = null;
  
  // Registered providers
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderId = "google-gemini";

  // Priority Queue
  private queue: QueueItem[] = [];
  private activeExecutionsCount = 0;
  private maxConcurrentExecutions = 3;

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): AIRequestManager {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager();
    }
    return AIRequestManager.instance;
  }

  private registerDefaultProviders() {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicClaudeProvider());
    this.registerProvider(new AzureOpenAIProvider());
    this.registerProvider(new LocalModelProvider());
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AIProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new AIRuntimeError(
        AIErrorCode.ProviderUnavailable,
        `AI Provider '${id}' is not registered in the runtime layer.`
      );
    }
    return provider;
  }

  /**
   * Helper to convert priority string to a sortable numeric weight
   */
  private getPriorityWeight(priority?: AIRequestOptions["priority"]): number {
    switch (priority) {
      case "CRITICAL": return 4;
      case "HIGH": return 3;
      case "MEDIUM": return 2;
      case "LOW": return 1;
      default: return 2; // Default is MEDIUM
    }
  }

  /**
   * Submit a request into the priority orchestration pipeline.
   */
  public executeRequest<T = any>(
    options: AIRequestOptions,
    providerId?: string
  ): Promise<AIResponse<T>> {
    const pId = providerId || this.defaultProviderId;
    const provider = this.getProvider(pId);
    const requestId = `REQ-${Math.floor(Math.random() * 1000000)}`;

    return new Promise<AIResponse<T>>((resolve, reject) => {
      const queueItem: QueueItem = {
        id: requestId,
        options,
        provider,
        priority: this.getPriorityWeight(options.priority),
        resolve,
        reject,
        state: AIRequestState.QUEUED,
        createdAt: Date.now()
      };

      this.queue.push(queueItem);
      this.sortQueue();
      this.processQueue();
    });
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      // Sort by priority weight (descending)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // If priorities match, favor the earlier request (FIFO)
      return a.createdAt - b.createdAt;
    });
  }

  private async processQueue() {
    if (this.activeExecutionsCount >= this.maxConcurrentExecutions) {
      return;
    }

    const nextItem = this.queue.find(item => item.state === AIRequestState.QUEUED);
    if (!nextItem) {
      return;
    }

    nextItem.state = AIRequestState.EXECUTING;
    this.activeExecutionsCount++;

    // Remove from queue since we're initiating it
    this.queue = this.queue.filter(item => item.id !== nextItem.id);

    try {
      const result = await this.orchestratePipeline(nextItem);
      nextItem.resolve(result);
    } catch (err) {
      nextItem.reject(err);
    } finally {
      this.activeExecutionsCount--;
      this.processQueue(); // Poll next queue item
    }
  }

  /**
   * Orchestrates the 6 main lifecycle pipelines:
   * Request, Execution, Response, Validation, Failure, and Audit.
   */
  private async orchestratePipeline<T = any>(item: QueueItem): Promise<AIResponse<T>> {
    const correlationId = item.options.correlationId || `CORR-${Math.floor(Math.random() * 100000)}`;
    const startTime = Date.now();
    
    // --- 1. REQUEST LIFECYCLE / CONTEXT BUILDING ---
    let context: AIRequestContext;
    try {
      context = await ContextBuilder.buildContext();
    } catch (err: any) {
      const wrapped = new AIRuntimeError(
        AIErrorCode.ContextMissing,
        `Context building failed: ${err.message}`,
        err
      );
      this.handleFailurePipeline(item, wrapped, startTime, correlationId);
      throw wrapped;
    }

    // --- 2. PROMPT REGISTRY INJECTION ---
    let renderedPromptText: string;
    let promptVersion = item.options.promptVersion || "1.0";
    try {
      const renderResult = PromptRegistry.getInstance().renderPrompt(
        item.options.promptId,
        item.options.parameters,
        item.options.promptVersion
      );
      renderedPromptText = renderResult.text;
      promptVersion = renderResult.prompt.version;
    } catch (err: any) {
      const wrapped = err instanceof AIRuntimeError ? err : new AIRuntimeError(
        AIErrorCode.PromptValidationFailed,
        `Prompt rendering failed: ${err.message}`,
        err
      );
      this.handleFailurePipeline(item, wrapped, startTime, correlationId, context, promptVersion);
      throw wrapped;
    }

    // --- 3. EXECUTION PIPELINE WITH RETRIES & TIMEOUTS & CANCELLATION ---
    let rawResponse = "";
    let modelUsed = item.provider.defaultModel;
    const maxRetries = item.options.retries ?? 2;
    const timeoutMs = item.options.timeoutMs ?? 10000;

    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const generationResult = await item.provider.generate(renderedPromptText, {
          signal: controller.signal,
          timeoutMs,
          priority: item.options.priority
        });
        rawResponse = generationResult.text;
        modelUsed = generationResult.modelUsed;
        lastError = null;
        clearTimeout(timeoutId);
        break; // Success! Break retry loop
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        attempt++;
        console.warn(`[AIRequestManager] Attempt ${attempt} failed for request ${item.id}: ${err.message}`);
        
        // Wait a small backoff before retrying (exponential backoff)
        if (attempt <= maxRetries) {
          await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 300));
        }
      }
    }

    if (lastError) {
      let code = AIErrorCode.ProviderUnavailable;
      if (lastError.name === "AbortError" || lastError.code === AIErrorCode.Timeout) {
        code = AIErrorCode.Timeout;
      }
      const wrapped = new AIRuntimeError(
        code,
        `AI Model Execution failed after ${attempt} attempts: ${lastError.message}`,
        lastError
      );
      this.handleFailurePipeline(item, wrapped, startTime, correlationId, context, promptVersion, modelUsed);
      throw wrapped;
    }

    // --- 4. VALIDATION PIPELINE & REPAIR HOOKS ---
    item.state = AIRequestState.VALIDATING;
    const targetSchema = item.options.responseSchema || {
      required: ["recommendationId", "title", "action", "estimatedEffectMinutes", "confidenceScore", "rationale"],
      properties: {
        recommendationId: { type: "string" },
        title: { type: "string" },
        action: { type: "string" },
        estimatedEffectMinutes: { type: "number" },
        confidenceScore: { type: "number" },
        rationale: { type: "string" }
      }
    };

    const validation = JSONValidator.validate<T>(rawResponse, targetSchema, true);
    
    // --- 5. CONFIDENCE NORMALIZATION PIPELINE ---
    const reportedModelCertainty = (validation.data as any)?.confidenceScore ?? 0.80;
    const confidenceMetric = ConfidenceEngine.evaluate(context, reportedModelCertainty);

    if (confidenceMetric.overallScore < 0.5) {
      const wrapped = new AIRuntimeError(
        AIErrorCode.LowConfidence,
        `Pipeline rejected response due to exceptionally low confidence score: ${confidenceMetric.overallScore}`,
        { confidenceMetric, validationResult: validation }
      );
      this.handleFailurePipeline(item, wrapped, startTime, correlationId, context, promptVersion, modelUsed);
      throw wrapped;
    }

    const latencyMs = Date.now() - startTime;

    // --- 6. AUDIT LEDGER PIPELINE ---
    const auditEntry: AIAuditEntry = {
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      promptId: item.options.promptId,
      promptVersion,
      correlationId,
      providerId: item.provider.id,
      modelName: modelUsed,
      latencyMs,
      executionTime: new Date().toISOString(),
      validationStatus: validation.isValid ? (validation.repaired ? "REPAIRED" : "SUCCESS") : "FAILED",
      validationErrors: validation.errors,
      contextSnapshot: context
    };

    AIAuditLayer.getInstance().log(auditEntry);

    return {
      rawResponse,
      parsedData: validation.data as T,
      confidence: confidenceMetric,
      auditEntry
    };
  }

  /**
   * Dedicated error and failure lifecycle handler
   */
  private handleFailurePipeline(
    item: QueueItem,
    error: AIRuntimeError,
    startTime: number,
    correlationId: string,
    contextSnapshot?: AIRequestContext,
    promptVersion?: string,
    modelName?: string
  ) {
    const latencyMs = Date.now() - startTime;
    const fallbackContext: AIRequestContext = contextSnapshot || {
      timestamp: new Date().toISOString(),
      currentTime: new Date().toISOString(),
      matchState: null,
      weatherState: null,
      activeIncidents: [],
      crowdZones: [],
      gates: [],
      transportLines: [],
      resources: { volunteers: [], medicalTeams: [], securityTeams: [], accessibilityResources: [] },
      operatorSession: null,
      operationalPolicies: []
    };

    const auditEntry: AIAuditEntry = {
      id: `AUD-FAIL-${Math.floor(Math.random() * 1000000)}`,
      promptId: item.options.promptId,
      promptVersion: promptVersion || "UNKNOWN",
      correlationId,
      providerId: item.provider.id,
      modelName: modelName || item.provider.defaultModel,
      latencyMs,
      executionTime: new Date().toISOString(),
      validationStatus: "FAILED",
      validationErrors: [error.message],
      contextSnapshot: fallbackContext
    };

    AIAuditLayer.getInstance().log(auditEntry);
  }
}
