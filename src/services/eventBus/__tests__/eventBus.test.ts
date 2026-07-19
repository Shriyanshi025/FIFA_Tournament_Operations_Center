/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus, EventBusAdapter } from "../EventBus";
import { EventType, EventCategory } from "../../../types/events";

describe("EventBus Unit Test Suite", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  it("singleton instance management returns identical reference", () => {
    const instance2 = EventBus.getInstance();
    expect(eventBus).toBe(instance2);
  });

  it("publishes events and notifies subscribers in exact ordering", () => {
    const receivedEvents: string[] = [];

    eventBus.subscribe(EventType.IncidentCreated, (e) => {
      receivedEvents.push(`sub1:${e.payload.incident.id}`);
    });

    eventBus.subscribe(EventType.IncidentCreated, (e) => {
      receivedEvents.push(`sub2:${e.payload.incident.id}`);
    });

    eventBus.publish(
      EventType.IncidentCreated,
      EventCategory.SYSTEM,
      { incident: { id: "INC-1" } } as any,
      "TEST"
    );

    expect(receivedEvents).toEqual(["sub1:INC-1", "sub2:INC-1"]);
    expect(eventBus.getHistorySize()).toBeGreaterThanOrEqual(1);
  });

  it("subscribeOnce fires only once and automatically unsubscribes", () => {
    let callCount = 0;

    eventBus.subscribeOnce(EventType.WeatherUpdated, () => {
      callCount++;
    });

    eventBus.publish(EventType.WeatherUpdated, EventCategory.SYSTEM, {} as any, "TEST");
    eventBus.publish(EventType.WeatherUpdated, EventCategory.SYSTEM, {} as any, "TEST");

    expect(callCount).toBe(1);
  });

  it("unsubscribe removes listener by subscription ID", () => {
    let callCount = 0;

    const sub = eventBus.subscribe(EventType.GateQueueUpdated, () => {
      callCount++;
    });

    eventBus.publish(EventType.GateQueueUpdated, EventCategory.SYSTEM, {} as any, "TEST");
    expect(callCount).toBe(1);

    const removed = sub.unsubscribe();
    expect(removed).toBe(true);

    eventBus.publish(EventType.GateQueueUpdated, EventCategory.SYSTEM, {} as any, "TEST");
    expect(callCount).toBe(1);
  });

  it("isolates subscriber errors so throwing in one callback does not break other subscribers", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let sub2Fired = false;

    eventBus.subscribe(EventType.TransportUpdated, () => {
      throw new Error("Subscriber 1 crash!");
    });

    eventBus.subscribe(EventType.TransportUpdated, () => {
      sub2Fired = true;
    });

    expect(() => {
      eventBus.publish(EventType.TransportUpdated, EventCategory.SYSTEM, {} as any, "TEST");
    }).not.toThrow();

    expect(sub2Fired).toBe(true);
    consoleErrorSpy.mockRestore();
  });

  it("replays historical events filtered by criteria", () => {
    eventBus.clear();
    eventBus.publish(EventType.IncidentCreated, EventCategory.SYSTEM, { incident: { id: "1" } } as any, "SRC1");
    eventBus.publish(EventType.WeatherUpdated, EventCategory.OPERATIONAL, { weather: {} } as any, "SRC2");

    const replayedIncident = eventBus.replayEvents({ type: EventType.IncidentCreated });
    expect(replayedIncident.length).toBeGreaterThanOrEqual(1);

    const replayedWeather = eventBus.replayEvents({ type: EventType.WeatherUpdated });
    expect(replayedWeather.length).toBe(1);
    expect(replayedWeather[0].type).toBe(EventType.WeatherUpdated);
  });

  it("registers and propagates events to external adapters", () => {
    const mockAdapter: EventBusAdapter = {
      publish: vi.fn(),
    };

    eventBus.registerAdapter("mock-adapter", mockAdapter);
    expect(eventBus.getRegisteredAdapters()).toContain("mock-adapter");

    eventBus.publish(EventType.IncidentCreated, EventCategory.SYSTEM, {} as any, "TEST");
    expect(mockAdapter.publish).toHaveBeenCalled();

    eventBus.unregisterAdapter("mock-adapter");
    expect(eventBus.getRegisteredAdapters()).not.toContain("mock-adapter");
  });
});
