/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CollaborationService } from "../CollaborationService";

describe("CollaborationService Communication Center Unit Test Suite", () => {
  let service: CollaborationService;

  beforeEach(() => {
    service = CollaborationService.getInstance();
  });

  afterEach(() => {
    service.simulateNetworkState(true);
    vi.restoreAllMocks();
  });

  it("singleton instance returns active connection and provider name", () => {
    expect(service).toBeDefined();
    expect(service.getProviderName()).toBe("MockCollaborationProvider");
    expect(service.isConnected()).toBe(true);
  });

  it("subscribes to connection status changes", () => {
    const statuses: string[] = [];
    const unsubscribe = service.subscribeToConnectionStatus((status) => {
      statuses.push(status);
    });

    service.simulateNetworkState(false);
    service.simulateNetworkState(true);

    expect(statuses).toContain("disconnected");
    expect(statuses).toContain("connected");

    unsubscribe();
  });

  it("buffers operations in offline queue when device is offline and replays them on reconnect", async () => {
    service.simulateNetworkState(false);
    expect(service.isConnected()).toBe(false);

    const sendPromise = service.sendMessage({
      senderId: "op-1",
      senderName: "Operator John",
      senderRole: "SECURITY" as any,
      type: "internal_note",
      content: "Offline test message",
    });

    await sendPromise;
    expect(service.getOfflineQueueLength()).toBeGreaterThan(0);

    service.simulateNetworkState(true);

    await new Promise((res) => setTimeout(res, 50));
    expect(service.getOfflineQueueLength()).toBe(0);
  });

  it("acquires and releases record locks while connected", async () => {
    const acquired = await service.acquireLock("INC-LOCK-1", "incident", "op-1", "John");
    expect(acquired).toBe(true);

    const released = await service.releaseLock("INC-LOCK-1", "op-1");
    expect(released).toBe(true);
  });

  it("denies lock acquisition when network is offline", async () => {
    service.simulateNetworkState(false);
    const acquired = await service.acquireLock("INC-LOCK-2", "incident", "op-1", "John");
    expect(acquired).toBe(false);
  });
});
