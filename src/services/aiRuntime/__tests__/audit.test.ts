/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AIAuditLayer } from "../audit";
import { AIAuditEntry } from "../types";

describe("AIAuditLayer Safety Ledger Test Suite", () => {
  let auditLayer: AIAuditLayer;

  beforeEach(() => {
    auditLayer = AIAuditLayer.getInstance();
    auditLayer.clear();
  });

  it("singleton instance returns consistent state", () => {
    const instance2 = AIAuditLayer.getInstance();
    expect(auditLayer).toBe(instance2);
  });

  it("logs audit entries and retrieves them by ID", () => {
    const entry: AIAuditEntry = {
      id: "AUD-TEST-100",
      promptId: "evaluate-situation",
      promptVersion: "1.0",
      correlationId: "CORR-TEST-100",
      providerId: "google-gemini",
      modelName: "gemini-2.5-flash",
      latencyMs: 140,
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
    };

    auditLayer.log(entry);

    const retrieved = auditLayer.getEntry("AUD-TEST-100");
    expect(retrieved).toBeDefined();
    expect(retrieved?.promptId).toBe("evaluate-situation");
    expect(retrieved?.providerId).toBe("google-gemini");
  });

  it("records operator decisions on audit entries", () => {
    const entry: AIAuditEntry = {
      id: "AUD-TEST-200",
      promptId: "crowd-congestion-mitigation",
      promptVersion: "1.1",
      correlationId: "CORR-TEST-200",
      providerId: "google-gemini",
      modelName: "gemini-2.5-flash",
      latencyMs: 180,
      executionTime: new Date().toISOString(),
      validationStatus: "SUCCESS",
      contextSnapshot: {} as any,
    };

    auditLayer.log(entry);
    auditLayer.recordDecision("AUD-TEST-200", "APPROVED");

    const updated = auditLayer.getEntry("AUD-TEST-200");
    expect(updated?.operatorDecision).toBe("APPROVED");
    expect(updated?.operatorDecisionTime).toBeDefined();
  });

  it("getAllEntries returns entries sorted by execution time descending", () => {
    const time1 = new Date(Date.now() - 5000).toISOString();
    const time2 = new Date(Date.now()).toISOString();

    auditLayer.log({
      id: "AUD-EARLIER",
      promptId: "test",
      promptVersion: "1.0",
      correlationId: "C1",
      providerId: "p1",
      modelName: "m1",
      latencyMs: 100,
      executionTime: time1,
      validationStatus: "SUCCESS",
      contextSnapshot: {} as any,
    });

    auditLayer.log({
      id: "AUD-LATER",
      promptId: "test",
      promptVersion: "1.0",
      correlationId: "C2",
      providerId: "p1",
      modelName: "m1",
      latencyMs: 100,
      executionTime: time2,
      validationStatus: "SUCCESS",
      contextSnapshot: {} as any,
    });

    const entries = auditLayer.getAllEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].id).toBe("AUD-LATER");
    expect(entries[1].id).toBe("AUD-EARLIER");
  });

  it("clears all audit records when clear() is invoked", () => {
    auditLayer.log({
      id: "AUD-CLEAR-TEST",
      promptId: "test",
      promptVersion: "1.0",
      correlationId: "C",
      providerId: "p",
      modelName: "m",
      latencyMs: 50,
      executionTime: new Date().toISOString(),
      validationStatus: "SUCCESS",
      contextSnapshot: {} as any,
    });

    expect(auditLayer.getAllEntries().length).toBe(1);
    auditLayer.clear();
    expect(auditLayer.getAllEntries().length).toBe(0);
  });
});
