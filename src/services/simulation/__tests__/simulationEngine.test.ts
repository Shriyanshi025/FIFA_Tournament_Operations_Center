/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SimulationEngine, SCENARIO_DEFINITIONS } from "../SimulationEngine";

describe("SimulationEngine Unit Test Suite", () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = SimulationEngine.getInstance();
    engine.reset();
  });

  afterEach(() => {
    engine.reset();
    vi.restoreAllMocks();
  });

  it("singleton instance initializes with default state and scenarios", () => {
    const instance2 = SimulationEngine.getInstance();
    expect(engine).toBe(instance2);

    const state = engine.getState();
    expect(state.currentStage).toBe("Pregame");
    expect(state.isPaused).toBe(true);
    expect(state.activeScenarioId).toBe("SC-NORMAL");
    expect(SCENARIO_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("supports controls: pause, resume, speed adjustment, scenario loading, reset", () => {
    engine.resume();
    expect(engine.getState().isPaused).toBe(false);

    engine.pause();
    expect(engine.getState().isPaused).toBe(true);

    engine.setSpeed(5);
    expect(engine.getState().speedMultiplier).toBe(5);

    engine.loadScenario("SC-RAIN");
    expect(engine.getState().activeScenarioId).toBe("SC-RAIN");
    expect(engine.getState().isPaused).toBe(false);

    engine.reset();
    expect(engine.getState().activeScenarioId).toBe("SC-NORMAL");
    expect(engine.getState().isPaused).toBe(true);
  });

  it("advances simulation tick and updates virtual timeline state", async () => {
    engine.loadScenario("SC-NORMAL");
    const initialTick = engine.getState().tickCount;

    const result = await engine.tick();
    expect(engine.getState().tickCount).toBe(initialTick + 1);
    expect(result).toBeDefined();
    expect(Array.isArray(result.incidentsTriggered)).toBe(true);
  });

  it("does not advance tick state when simulation is paused", async () => {
    engine.pause();
    const initialTick = engine.getState().tickCount;

    const result = await engine.tick();
    expect(engine.getState().tickCount).toBe(initialTick);
    expect(result.incidentsTriggered.length).toBe(0);
  });

  it("handles scenario events: SC-RAIN triggers incidents and notifications", async () => {
    engine.loadScenario("SC-RAIN");

    let totalIncidents = 0;
    for (let i = 0; i < 10; i++) {
      const res = await engine.tick();
      totalIncidents += res.incidentsTriggered.length;
    }

    expect(totalIncidents).toBeGreaterThan(0);
  });
});
