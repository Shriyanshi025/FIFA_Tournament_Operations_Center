/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PromptRegistry } from "../promptRegistry";
import { AIRuntimeError, AIErrorCode } from "../errors";

describe("PromptRegistry Unit Test Suite", () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    registry = PromptRegistry.getInstance();
  });

  it("retrieves seeded operational prompts by ID", () => {
    const prompt = registry.getPrompt("evaluate-situation");
    expect(prompt).toBeDefined();
    expect(prompt.id).toBe("evaluate-situation");
    expect(prompt.requiredParameters).toEqual([
      "incidentId",
      "sector",
      "severity",
      "weatherAdvisory",
    ]);
  });

  it("retrieves the highest version when version is omitted", () => {
    registry.registerPrompt({
      id: "versioned-test-prompt",
      version: "1.0",
      category: "OPERATIONAL",
      metadata: {
        title: "Version 1",
        description: "v1 description",
        author: "Test",
        tags: [],
        createdAt: new Date().toISOString(),
      },
      template: "Version 1: {{var}}",
      requiredParameters: ["var"],
    });

    registry.registerPrompt({
      id: "versioned-test-prompt",
      version: "2.5",
      category: "OPERATIONAL",
      metadata: {
        title: "Version 2.5",
        description: "v2.5 description",
        author: "Test",
        tags: [],
        createdAt: new Date().toISOString(),
      },
      template: "Version 2.5: {{var}}",
      requiredParameters: ["var"],
    });

    const latest = registry.getPrompt("versioned-test-prompt");
    expect(latest.version).toBe("2.5");

    const v1 = registry.getPrompt("versioned-test-prompt", "1.0");
    expect(v1.version).toBe("1.0");
  });

  it("renders templates by substituting parameters correctly", () => {
    const rendered = registry.renderPrompt("evaluate-situation", {
      incidentId: "INC-99",
      sector: "East Concourse",
      severity: "CRITICAL",
      weatherAdvisory: "Heavy rain",
    });

    expect(rendered.text).toContain("INC-99");
    expect(rendered.text).toContain("East Concourse");
    expect(rendered.text).toContain("CRITICAL");
    expect(rendered.text).toContain("Heavy rain");
  });

  it("throws PromptValidationFailed when required parameters are missing", () => {
    expect(() =>
      registry.renderPrompt("evaluate-situation", {
        incidentId: "INC-99",
        sector: "East Concourse",
        // missing severity and weatherAdvisory
      })
    ).toThrow(AIRuntimeError);

    try {
      registry.renderPrompt("evaluate-situation", {
        incidentId: "INC-99",
      });
    } catch (err: any) {
      expect(err.code).toBe(AIErrorCode.PromptValidationFailed);
      expect(err.message).toContain("Missing required parameters");
    }
  });

  it("throws PromptValidationFailed when querying unknown prompt ID", () => {
    expect(() => registry.getPrompt("completely-unknown-id-xyz")).toThrow(AIRuntimeError);
  });

  it("returns registered prompt list", () => {
    const list = registry.getRegisteredPromptsList();
    expect(list.length).toBeGreaterThan(0);
    const evaluate = list.find((p) => p.id === "evaluate-situation");
    expect(evaluate).toBeDefined();
  });
});
