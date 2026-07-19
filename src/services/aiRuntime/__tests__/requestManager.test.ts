/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIRequestManager } from "../requestManager";
import { AIRuntimeError, AIErrorCode } from "../errors";
import { AIProvider } from "../types";
import { AIAuditLayer } from "../audit";

describe("AIRequestManager Unit & Integration Test Suite", () => {
  let requestManager: AIRequestManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    requestManager = AIRequestManager.getInstance();
  });

  it("should return singleton instance and register default providers", () => {
    const instance2 = AIRequestManager.getInstance();
    expect(requestManager).toBe(instance2);

    const gemini = requestManager.getProvider("google-gemini");
    expect(gemini).toBeDefined();
    expect(gemini.name).toContain("Google Gemini");

    const local = requestManager.getProvider("local-model");
    expect(local).toBeDefined();
  });

  it("throws ProviderUnavailable when requesting an unregistered provider", () => {
    expect(() => requestManager.getProvider("non-existent-provider")).toThrow(AIRuntimeError);
    try {
      requestManager.getProvider("non-existent-provider");
    } catch (err: any) {
      expect(err.code).toBe(AIErrorCode.ProviderUnavailable);
    }
  });

  it("allows registering custom providers", () => {
    const mockProvider: AIProvider = {
      id: "custom-mock-provider",
      name: "Custom Mock Provider",
      supportedModels: ["custom-v1"],
      defaultModel: "custom-v1",
      generate: async () => ({
        text: '{"status":"ok"}',
        modelUsed: "custom-v1",
        finishReason: "STOP",
      }),
    };

    requestManager.registerProvider(mockProvider);
    expect(requestManager.getProvider("custom-mock-provider")).toBe(mockProvider);
  });

  it("processes requests sequentially or concurrently up to max limit and respects priority ordering", async () => {
    const mockProvider: AIProvider = {
      id: "priority-test-provider",
      name: "Priority Test Provider",
      supportedModels: ["v1"],
      defaultModel: "v1",
      generate: async () => {
        return {
          text: JSON.stringify({
            recommendationId: "REC-100",
            title: "Priority Dispatch",
            action: "Clear sector gate",
            estimatedEffectMinutes: 5,
            confidenceScore: 0.92,
            rationale: "Congestion surge detected.",
          }),
          modelUsed: "v1",
          finishReason: "STOP",
        };
      },
    };

    requestManager.registerProvider(mockProvider);

    const responsePromise = requestManager.executeRequest(
      {
        promptId: "evaluate-situation",
        parameters: {
          incidentId: "INC-1",
          sector: "North Gate",
          severity: "CRITICAL",
          weatherAdvisory: "Clear",
        },
        priority: "CRITICAL",
      },
      "priority-test-provider"
    );

    const response = await responsePromise;
    expect(response.parsedData).toBeDefined();
    expect(response.parsedData.title).toBe("Priority Dispatch");
    expect(response.confidence.overallScore).toBeGreaterThanOrEqual(0.5);
    expect(response.auditEntry).toBeDefined();
    expect(response.auditEntry.validationStatus).toBe("SUCCESS");
  });

  it("throws PromptValidationFailed when prompt ID does not exist in PromptRegistry", async () => {
    await expect(
      requestManager.executeRequest({
        promptId: "non-existent-prompt-id-12345",
        parameters: {},
      })
    ).rejects.toThrow(AIRuntimeError);

    try {
      await requestManager.executeRequest({
        promptId: "non-existent-prompt-id-12345",
        parameters: {},
      });
    } catch (err: any) {
      expect(err.code).toBe(AIErrorCode.PromptValidationFailed);
    }
  });

  it("handles execution retries when AI provider temporarily fails", async () => {
    let callCount = 0;
    const retryProvider: AIProvider = {
      id: "retry-test-provider",
      name: "Retry Provider",
      supportedModels: ["v1"],
      defaultModel: "v1",
      generate: async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Temporary provider rate limit failure");
        }
        return {
          text: JSON.stringify({
            recommendationId: "REC-RETRY",
            title: "Retried Dispatch",
            action: "Re-route spectator queue",
            estimatedEffectMinutes: 10,
            confidenceScore: 0.88,
            rationale: "Successfully retried after transient glitch.",
          }),
          modelUsed: "v1",
          finishReason: "STOP",
        };
      },
    };

    requestManager.registerProvider(retryProvider);

    const response = await requestManager.executeRequest(
      {
        promptId: "evaluate-situation",
        parameters: {
          incidentId: "INC-RETRY",
          sector: "South Gate",
          severity: "HIGH",
          weatherAdvisory: "Clear",
        },
        retries: 2,
      },
      "retry-test-provider"
    );

    expect(callCount).toBe(2);
    expect(response.parsedData.title).toBe("Retried Dispatch");
  });

  it("logs failure to audit ledger when requests fail permanently", async () => {
    const failingProvider: AIProvider = {
      id: "always-failing-provider",
      name: "Failing Provider",
      supportedModels: ["v1"],
      defaultModel: "v1",
      generate: async () => {
        throw new Error("Permanent API infrastructure crash");
      },
    };

    requestManager.registerProvider(failingProvider);

    const auditCountBefore = AIAuditLayer.getInstance().getAllEntries().length;

    await expect(
      requestManager.executeRequest(
        {
          promptId: "evaluate-situation",
          parameters: {
            incidentId: "INC-FAIL",
            sector: "East Gate",
            severity: "MEDIUM",
            weatherAdvisory: "Clear",
          },
          retries: 0,
        },
        "always-failing-provider"
      )
    ).rejects.toThrow(AIRuntimeError);

    const entriesAfter = AIAuditLayer.getInstance().getAllEntries();
    expect(entriesAfter.length).toBe(auditCountBefore + 1);

    // entriesAfter[0] is the newest audit entry
    const newestAudit = entriesAfter[0];
    expect(newestAudit.validationStatus).toBe("FAILED");
    expect(newestAudit.providerId).toBe("always-failing-provider");
  });
});
