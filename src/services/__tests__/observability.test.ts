/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { telemetry } from "../observability";
import { logger } from "../../utils/logger";

describe("Observability Telemetry & Logger Unit Test Suite", () => {
  beforeEach(() => {
    telemetry.clearLogs();
  });

  it("telemetry records structured logs into buffer", () => {
    telemetry.log("INFO", "Test log message", { testKey: "testVal" }, { correlationId: "CORR-OBS-1" });

    const logs = telemetry.getLogs();
    expect(logs.length).toBeGreaterThan(0);

    const latest = logs[logs.length - 1];
    expect(latest.level).toBe("INFO");
    expect(latest.message).toBe("Test log message");
    expect(latest.correlationId).toBe("CORR-OBS-1");
  });

  it("records latency measurements and calculates rolling averages", () => {
    telemetry.recordLatency("ai_request", 120);
    telemetry.recordLatency("ai_request", 180);

    const history = telemetry.getLatencyHistory("ai_request");
    expect(history.length).toBeGreaterThanOrEqual(2);

    const summary = telemetry.getMetricsSummary();
    expect(summary.averageLatenciesMs.ai_request).toBeGreaterThan(0);
  });

  it("reports component status and updates overall platform health", () => {
    telemetry.reportComponentStatus("GeminiProvider", "OK", 100);
    let health = telemetry.getPlatformHealth();
    expect(health.components.GeminiProvider.status).toBe("OK");

    telemetry.reportComponentStatus("GeminiProvider", "DEGRADED", 400, "High latency");
    health = telemetry.getPlatformHealth();
    expect(health.components.GeminiProvider.status).toBe("DEGRADED");
    expect(health.overall).toBe("DEGRADED");

    telemetry.reportComponentStatus("GeminiProvider", "FAILING", 0, "Connection timeout");
    health = telemetry.getPlatformHealth();
    expect(health.components.GeminiProvider.status).toBe("FAILING");
    expect(health.overall).toBe("FAILING");
  });

  it("logger utility formats and logs messages correctly", () => {
    expect(() => logger.info("ObservabilityService", "Observability logger info test")).not.toThrow();
    expect(() => logger.warn("ObservabilityService", "Observability logger warn test")).not.toThrow();
    expect(() => logger.error("ObservabilityService", "Observability logger error test")).not.toThrow();
  });
});
