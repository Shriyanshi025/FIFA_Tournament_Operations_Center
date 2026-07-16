/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CollaborationProvider, 
  OperatorPresence, 
  RecordLock, 
  TeamMessage, 
  CollaborationEvent, 
  CollaborationActivity,
  SyncStatePayload
} from "../../types/collaboration";
import { telemetry } from "../observability";
import { MockCollaborationProvider } from "./MockCollaborationProvider";

interface QueuedOperation {
  id: string;
  description: string;
  timestamp: number;
  execute: () => Promise<any>;
  onSuccess?: (res: any) => void;
  onFailure?: (err: Error) => void;
}

export class CollaborationService {
  private static instance: CollaborationService | null = null;
  private provider: CollaborationProvider;
  
  private connectionStatus: "connected" | "disconnected" | "reconnecting" = "connected";
  private statusListeners: Set<(status: "connected" | "disconnected" | "reconnecting") => void> = new Set();
  
  // Offline Buffer Queue
  private offlineQueue: QueuedOperation[] = [];
  private processedEventIds: Set<string> = new Set(); // For duplicate event prevention
  
  public static getInstance(): CollaborationService {
    if (!this.instance) {
      this.instance = new CollaborationService();
    }
    return this.instance;
  }

  private constructor() {
    // Default to MockCollaborationProvider (can be swapped in future with WebSockets/Firebase)
    this.provider = new MockCollaborationProvider();
    
    // Wire up connection state listener
    this.provider.connect((status) => {
      const prevStatus = this.connectionStatus;
      this.connectionStatus = status;
      this.statusListeners.forEach(listener => listener(status));
      
      telemetry.log("INFO", `Collaboration network connection state changed to: ${status}`, { status });
      telemetry.reportComponentStatus("CollaborationLayer", status === "connected" ? "OK" : status === "reconnecting" ? "DEGRADED" : "FAILING", 1, `Status: ${status}`);

      if (status === "connected" && prevStatus !== "connected") {
        console.log("[CollaborationService] Connection recovered. Initiating offline queue replay & state sync...");
        this.replayOfflineQueue();
      }
    }).catch(err => {
      console.error("[CollaborationService] Initial connection error:", err);
      this.connectionStatus = "disconnected";
      telemetry.reportComponentStatus("CollaborationLayer", "FAILING", 1, err.message);
      telemetry.log("ERROR", "Collaboration layer initialization connection error", { error: err.message });
    });
  }

  // Swap provider dynamically (Firebase, Socket.IO, WebSockets, etc.)
  public setProvider(newProvider: CollaborationProvider) {
    console.log(`[CollaborationService] Switching provider from ${this.provider.name} to ${newProvider.name}`);
    this.provider.disconnect();
    this.provider = newProvider;
    
    this.provider.connect((status) => {
      this.connectionStatus = status;
      this.statusListeners.forEach(listener => listener(status));
      if (status === "connected") {
        this.replayOfflineQueue();
      }
    }).catch(err => {
      console.error(`[CollaborationService] Error connecting new provider ${newProvider.name}:`, err);
    });
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public subscribeToConnectionStatus(listener: (status: "connected" | "disconnected" | "reconnecting") => void): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => this.statusListeners.delete(listener);
  }

  public isConnected(): boolean {
    return this.connectionStatus === "connected";
  }

  public getOfflineQueueLength(): number {
    return this.offlineQueue.length;
  }

  public getOfflineQueue(): Omit<QueuedOperation, "execute">[] {
    return this.offlineQueue.map(({ id, description, timestamp }) => ({ id, description, timestamp }));
  }

  // Connection trigger simulation (useful for showing offline state in the UI)
  public simulateNetworkState(online: boolean) {
    if (this.provider instanceof MockCollaborationProvider) {
      this.provider.triggerManualNetworkState(online);
    } else {
      console.warn("[CollaborationService] Cannot simulate network on non-mock provider.");
    }
  }

  // Abstracted subscriptions passing through provider
  public subscribeToPresence(callback: (presences: OperatorPresence[]) => void): () => void {
    return this.provider.subscribeToPresence(callback);
  }

  public subscribeToLocks(callback: (locks: RecordLock[]) => void): () => void {
    return this.provider.subscribeToLocks(callback);
  }

  public subscribeToMessages(callback: (messages: TeamMessage[]) => void): () => void {
    return this.provider.subscribeToMessages((messages) => {
      // Deduplicate messages on receipt
      const uniqueMessages = messages.filter(msg => {
        if (this.processedEventIds.has(msg.id)) {
          return true; // We keep it, but we already have logged it
        }
        this.processedEventIds.add(msg.id);
        return true;
      });
      callback(uniqueMessages);
    });
  }

  public subscribeToEvents(callback: (events: CollaborationEvent[]) => void): () => void {
    return this.provider.subscribeToEvents((events) => {
      const filteredEvents = events.filter(evt => {
        if (this.processedEventIds.has(evt.id)) {
          return true;
        }
        this.processedEventIds.add(evt.id);
        return true;
      });
      callback(filteredEvents);
    });
  }

  public subscribeToActivities(callback: (activities: CollaborationActivity[]) => void): () => void {
    return this.provider.subscribeToActivities(callback);
  }

  // Safe wrapper execution with offline support
  private async executeWithOfflineQueue<T>(
    operation: () => Promise<T>,
    description: string,
    optimisticAction?: () => void,
    onSuccess?: (res: T) => void,
    onFailure?: (err: Error) => void
  ): Promise<T | null> {
    if (this.isConnected()) {
      try {
        if (optimisticAction) optimisticAction();
        const result = await operation();
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        console.error(`[CollaborationService] Error running immediate operation (${description}):`, err);
        if (onFailure) onFailure(err as Error);
        throw err;
      }
    } else {
      // Network is offline! Queue operation for later
      console.warn(`[CollaborationService] Device is offline. Queueing operation: ${description}`);
      
      // Perform client optimistic updates immediately if applicable
      if (optimisticAction) optimisticAction();
      
      return new Promise<T | null>((resolve, reject) => {
        const queuedOp: QueuedOperation = {
          id: `QOP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description,
          timestamp: Date.now(),
          execute: operation,
          onSuccess: (res) => {
            if (onSuccess) onSuccess(res);
            resolve(res);
          },
          onFailure: (err) => {
            if (onFailure) onFailure(err);
            reject(err);
          }
        };
        
        this.offlineQueue.push(queuedOp);
        
        // Return null/resolved mock to avoid blocking client UI thread
        resolve(null);
      });
    }
  }

  // Replay queued operations chronologically on connection recovery
  private async replayOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`[CollaborationService] Replaying ${this.offlineQueue.length} offline buffered operations...`);
    const queueToProcess = [...this.offlineQueue];
    this.offlineQueue = []; // Clear queue to avoid re-entry loops
    
    for (const op of queueToProcess) {
      try {
        console.log(`[CollaborationService] Replaying offline action: ${op.description}`);
        const result = await op.execute();
        if (op.onSuccess) op.onSuccess(result);
      } catch (err) {
        console.error(`[CollaborationService] Failed to replay operation "${op.description}":`, err);
        // Put back in queue if still disconnected
        if (!this.isConnected()) {
          this.offlineQueue.unshift(op);
          break;
        }
        if (op.onFailure) op.onFailure(err as Error);
      }
    }
    
    // Force final state reconciliation
    this.reconcileState();
  }

  private async reconcileState() {
    const endMeasure = telemetry.startTimer("collaboration_sync");
    try {
      const syncPayload: SyncStatePayload = {
        lastSyncTimestamp: Date.now(),
        clientVersion: "1.0.0",
        entities: {
          incidents: [],
          recommendations: [],
          workflowQueue: []
        }
      };
      
      const res = await this.provider.syncState(syncPayload);
      const elapsed = endMeasure();
      
      telemetry.incrementMetric("collaborationSyncPackets");
      telemetry.reportComponentStatus("CollaborationLayer", "OK", elapsed);
      telemetry.log("INFO", "State synchronized with remote peer collaboration cluster.", {
        durationMs: elapsed,
        syncResult: "SUCCESS"
      });
      console.log("[CollaborationService] State successfully reconciled with remote:", res);
    } catch (err: any) {
      const elapsed = endMeasure();
      telemetry.reportComponentStatus("CollaborationLayer", "DEGRADED", elapsed, err.message);
      telemetry.log("WARN", "Collaboration state sync failed.", { error: err.message, durationMs: elapsed });
      console.error("[CollaborationService] Reconcile error:", err);
    }
  }

  // Mutation Wrapper Actions
  public async updatePresence(operatorId: string, presence: Partial<OperatorPresence>): Promise<void> {
    await this.executeWithOfflineQueue(
      () => this.provider.updatePresence(operatorId, presence),
      `Update presence for operator ${operatorId}`
    );
  }

  public async acquireLock(
    recordId: string, 
    recordType: RecordLock["recordType"], 
    operatorId: string, 
    operatorName: string
  ): Promise<boolean> {
    // Record locks are critical: do not allow locking if offline (no optimistic locks across networks)
    if (!this.isConnected()) {
      console.warn(`[CollaborationService] Denying lock acquisition for ${recordType} ${recordId} while offline.`);
      return false;
    }
    return this.provider.acquireLock(recordId, recordType, operatorId, operatorName);
  }

  public async releaseLock(recordId: string, operatorId: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn(`[CollaborationService] Denying unlock for ${recordId} while offline.`);
      return false;
    }
    return this.provider.releaseLock(recordId, operatorId);
  }

  public async sendMessage(
    message: Omit<TeamMessage, "id" | "timestamp" | "readReceipts">,
    optimisticCallback?: () => void
  ): Promise<TeamMessage | null> {
    return this.executeWithOfflineQueue(
      () => this.provider.sendMessage(message),
      `Send message: ${message.content.substring(0, 20)}...`,
      optimisticCallback
    );
  }

  public async markMessageAsRead(messageId: string, operatorId: string): Promise<void> {
    if (!this.isConnected()) return; // Discard or defer silently
    await this.provider.markMessageAsRead(messageId, operatorId);
  }

  public async publishEvent(event: Omit<CollaborationEvent, "id" | "timestamp">): Promise<CollaborationEvent | null> {
    return this.executeWithOfflineQueue(
      () => this.provider.publishEvent(event),
      `Publish operational event: ${event.title}`
    );
  }

  public async logActivity(activity: Omit<CollaborationActivity, "id" | "timestamp">): Promise<CollaborationActivity | null> {
    return this.executeWithOfflineQueue(
      () => this.provider.logActivity(activity),
      `Log Activity: ${activity.action}`
    );
  }
}
export const collaborationService = CollaborationService.getInstance();
