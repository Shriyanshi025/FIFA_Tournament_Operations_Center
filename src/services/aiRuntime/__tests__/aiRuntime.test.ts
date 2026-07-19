/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PromptRegistry } from "../promptRegistry";
import { AIRequestManager } from "../requestManager";
import { AIAuditLayer } from "../audit";

describe("AI Runtime & Governance Integration Test Suite", () => {
  const registry = PromptRegistry.getInstance();
  const manager = AIRequestManager.getInstance();
  const audit = AIAuditLayer.getInstance();

  beforeEach(() => {
    audit.clear();
  });

  it("retrieves existing prompt template successfully from registry", () => {
    const prompt = registry.getPrompt("evaluate-situation");
    expect(prompt).toBeDefined();
    expect(prompt.id).toBe("evaluate-situation");
    expect(prompt.requiredParameters.length).toBe(4);
  });

  it("fails when retrieving non-existent prompt ID", () => {
    expect(() => registry.getPrompt("invalid-non-existent-prompt")).toThrow();
  });

  it("renders registered prompt with variables successfully", () => {
    const rendered = registry.renderPrompt("evaluate-situation", {
      incidentId: "INC-101",
      sector: "East Stand",
      severity: "HIGH",
      weatherAdvisory: "Clear skies",
    });

    expect(rendered.text).toContain("INC-101");
    expect(rendered.text).toContain("East Stand");
  });

  it("logs audit entries and updates ledger cache", () => {
    const initialCount = audit.getAllEntries().length;

    audit.log({
      id: "AUD-TEST-999",
      promptId: "evaluate-situation",
      promptVersion: "1.0",
      correlationId: "CORR-TEST-999",
      providerId: "google-gemini",
      modelName: "gemini-2.5-flash",
      latencyMs: 150,
      executionTime: new Date().toISOString(),
      validationStatus: "SUCCESS",
      contextSnapshot: {
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
        operationalPolicies: [],
      },
    });

    const finalCount = audit.getAllEntries().length;
    expect(finalCount).toBe(initialCount + 1);
  });
});
