/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaffRole } from "./common";

export type OperatorStatus = "online" | "offline" | "away";

export interface OperatorPresence {
  operatorId: string;
  name: string;
  role: StaffRole;
  currentPage: string;
  assignedIncidentId?: string;
  activity: string;
  lastHeartbeat: number;
  status: OperatorStatus;
}

export interface RecordLock {
  recordId: string;
  recordType: "incident" | "recommendation" | "workflow" | "resource";
  lockedBy: string;
  lockedByName: string;
  lockedAt: number;
  expiresAt: number;
}

export type TeamMessageType = 
  | "incident_comment" 
  | "internal_note" 
  | "department_broadcast" 
  | "emergency_broadcast";

export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: StaffRole;
  type: TeamMessageType;
  content: string;
  timestamp: number;
  relatedIncidentId?: string;
  mentions?: string[]; // Operator IDs or Roles
  recipientDepartments?: string[];
  readReceipts: string[]; // List of operatorId who have read it
}

export type CollaborationEventType =
  | "recommendation_assigned"
  | "incident_escalated"
  | "approval_required"
  | "resource_unavailable"
  | "weather_warning"
  | "transport_disruption"
  | "medical_emergency";

export interface CollaborationEvent {
  id: string;
  type: CollaborationEventType;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  timestamp: number;
  relatedId?: string;
}

export interface CollaborationActivity {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;
  timestamp: number;
  relatedIncidentId?: string;
  relatedRecommendationId?: string;
  relatedWorkflowId?: string;
}

export interface SyncStatePayload {
  lastSyncTimestamp: number;
  clientVersion: string;
  entities: {
    incidents?: string[];
    recommendations?: string[];
    workflowQueue?: string[];
  };
}

// Abstract Provider Interface supporting Firebase, WebSockets, Socket.IO, etc.
export interface CollaborationProvider {
  name: string;
  connect(onStatusChange: (status: "connected" | "disconnected" | "reconnecting") => void): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Subscriptions
  subscribeToPresence(callback: (presences: OperatorPresence[]) => void): () => void;
  subscribeToLocks(callback: (locks: RecordLock[]) => void): () => void;
  subscribeToMessages(callback: (messages: TeamMessage[]) => void): () => void;
  subscribeToEvents(callback: (events: CollaborationEvent[]) => void): () => void;
  subscribeToActivities(callback: (activities: CollaborationActivity[]) => void): () => void;
  
  // Actions
  updatePresence(operatorId: string, presence: Partial<OperatorPresence>): Promise<void>;
  acquireLock(recordId: string, recordType: RecordLock["recordType"], operatorId: string, operatorName: string): Promise<boolean>;
  releaseLock(recordId: string, operatorId: string): Promise<boolean>;
  sendMessage(message: Omit<TeamMessage, "id" | "timestamp" | "readReceipts">): Promise<TeamMessage>;
  markMessageAsRead(messageId: string, operatorId: string): Promise<void>;
  publishEvent(event: Omit<CollaborationEvent, "id" | "timestamp">): Promise<CollaborationEvent>;
  logActivity(activity: Omit<CollaborationActivity, "id" | "timestamp">): Promise<CollaborationActivity>;
  
  // Sync
  syncState(payload: SyncStatePayload): Promise<Record<string, any>>;
}
