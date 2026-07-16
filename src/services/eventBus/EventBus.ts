/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppEvent, EventType, EventCategory } from "../../types/events";
import { telemetry } from "../observability";

export type EventCallback<T extends EventType = EventType> = (event: AppEvent<T>) => void;

export interface EventBusSubscription<T extends EventType = EventType> {
  id: string;
  type: T;
  callback: EventCallback<T>;
  once: boolean;
}

/**
 * Adapter interface for future-proofing external distributed integrations (e.g., Kafka, Pub/Sub, WebSockets).
 */
export interface EventBusAdapter {
  publish(event: AppEvent): void | Promise<void>;
}

export class EventBus {
  private static instance: EventBus | null = null;
  
  // Map of event types to their active subscribers
  private subscriptions: Map<EventType, EventBusSubscription[]> = new Map();
  
  // Historical ledger for event replaying and audit logs (limited to prevent memory leaks)
  private history: AppEvent[] = [];
  private readonly maxHistorySize = 1000;
  
  // Registered external systems/adapters
  private adapters: Map<string, EventBusAdapter> = new Map();
  
  // Counter for unique subscription IDs
  private subIdCounter = 0;

  private constructor() {}

  /**
   * Singleton pattern to guarantee single central message broker.
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event to all internal subscribers and registered adapters.
   */
  public publish<T extends EventType>(
    type: T,
    category: EventCategory,
    payload: AppEvent<T>["payload"],
    source: string,
    priority: AppEvent<T>["metadata"]["priority"] = "MEDIUM",
    correlationId?: string
  ): AppEvent<T> {
    const startTime = performance.now();
    
    const event: AppEvent<T> = {
      type,
      category,
      metadata: {
        id: `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source,
        correlationId,
        priority,
        version: "1.0",
      },
      payload,
    };

    // 1. Append to historical log for replaying
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // 2. Dispatch to internal subscribers
    const list = this.subscriptions.get(type) || [];
    const remaining: EventBusSubscription[] = [];

    // Copy list to avoid issues if subscribers unsubscribe during invocation
    const subscribers = [...list];

    for (const sub of subscribers) {
      try {
        sub.callback(event);
      } catch (err) {
        console.error(`[EventBus] Error in subscriber callback for event ${type}:`, err);
      }

      if (!sub.once) {
        remaining.push(sub);
      }
    }

    // Update subscription list, filtering out 'once' listeners that just fired
    this.subscriptions.set(type, remaining);

    // 3. Propagate to external message brokers (Firebase, Kafka, Pub/Sub, etc.)
    this.adapters.forEach((adapter, adapterId) => {
      try {
        adapter.publish(event);
      } catch (err) {
        console.error(`[EventBus] Adapter '${adapterId}' failed to process event ${type}:`, err);
        telemetry.log("ERROR", `Adapter ${adapterId} failed to process event ${type}`, { error: String(err) }, { correlationId });
      }
    });

    const elapsed = parseFloat((performance.now() - startTime).toFixed(3));
    telemetry.incrementMetric("eventBusThroughput");
    telemetry.reportComponentStatus("EventBus", "OK", elapsed);
    
    if (priority === "CRITICAL" || priority === "HIGH") {
      telemetry.log("WARN", `High-priority event dispatched: ${type} from source ${source}`, {
        category,
        priority,
        elapsedMs: elapsed,
      }, { correlationId, traceId: event.metadata.id });
    }

    return event;
  }

  /**
   * Register a callback listener for a specific EventType.
   */
  public subscribe<T extends EventType>(
    type: T,
    callback: EventCallback<T>
  ): { unsubscribe: () => void; id: string } {
    return this.addSubscription(type, callback, false);
  }

  /**
   * Register a one-shot callback listener that automatically unsubscribes after firing once.
   */
  public subscribeOnce<T extends EventType>(
    type: T,
    callback: EventCallback<T>
  ): { unsubscribe: () => void; id: string } {
    return this.addSubscription(type, callback, true);
  }

  /**
   * Unsubscribe a listener using its subscription ID.
   */
  public unsubscribe(id: string): boolean {
    let removed = false;
    this.subscriptions.forEach((subs, type) => {
      const idx = subs.findIndex(s => s.id === id);
      if (idx !== -1) {
        subs.splice(idx, 1);
        removed = true;
      }
    });
    return removed;
  }

  /**
   * Internal helper to create subscription entries.
   */
  private addSubscription<T extends EventType>(
    type: T,
    callback: EventCallback<T>,
    once: boolean
  ): { unsubscribe: () => void; id: string } {
    this.subIdCounter++;
    const id = `sub_${type}_${this.subIdCounter}`;
    
    const sub: EventBusSubscription<T> = {
      id,
      type,
      callback,
      once,
    };

    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, []);
    }
    
    // Cast to internal Subscription type
    this.subscriptions.get(type)!.push(sub as any);

    return {
      id,
      unsubscribe: () => this.unsubscribe(id),
    };
  }

  /**
   * Replays historical events matching criteria.
   */
  public replayEvents(options?: {
    type?: EventType;
    category?: EventCategory;
    since?: string;
    limit?: number;
  }): AppEvent[] {
    let filtered = [...this.history];

    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }
    if (options?.category) {
      filtered = filtered.filter(e => e.category === options.category);
    }
    if (options?.since) {
      const sinceTime = new Date(options.since).getTime();
      filtered = filtered.filter(e => new Date(e.metadata.timestamp).getTime() >= sinceTime);
    }
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Register an external message broker/connector adapter (WebSockets, Cloud Pub/Sub, Firebase, Kafka).
   */
  public registerAdapter(id: string, adapter: EventBusAdapter): void {
    this.adapters.set(id, adapter);
    console.log(`[EventBus] External integration adapter registered successfully: ${id}`);
  }

  /**
   * Unregister an external adapter.
   */
  public unregisterAdapter(id: string): boolean {
    return this.adapters.delete(id);
  }

  /**
   * Retrieve the complete list of registered adapters.
   */
  public getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Purge subscription list and historical events (useful for simulation resets).
   */
  public clear(): void {
    this.subscriptions.clear();
    this.history = [];
    console.log("[EventBus] Message broker state cleared completely.");
  }

  /**
   * Get total in-memory size of historical buffer.
   */
  public getHistorySize(): number {
    return this.history.length;
  }
}
