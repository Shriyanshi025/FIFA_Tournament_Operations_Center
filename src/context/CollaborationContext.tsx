/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  OperatorPresence, 
  RecordLock, 
  TeamMessage, 
  CollaborationEvent, 
  CollaborationActivity,
  TeamMessageType,
  CollaborationEventType
} from "../types/collaboration";
import { StaffRole } from "../types/common";
import { collaborationService } from "../services/collaboration/CollaborationService";

export interface CollaborationContextType {
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  presences: OperatorPresence[];
  locks: RecordLock[];
  messages: TeamMessage[];
  collabEvents: CollaborationEvent[];
  activities: CollaborationActivity[];
  offlineQueue: Array<{ id: string; description: string; timestamp: number }>;
  isConnected: boolean;
  
  // Active User Info (Mocked from session)
  operatorId: string;
  operatorName: string;
  operatorRole: StaffRole;
  currentTab: string;
  currentActivity: string;
  
  // Methods
  setCurrentTab: (tab: string) => void;
  setCurrentActivity: (activity: string) => void;
  isRecordLocked: (recordId: string) => boolean;
  getRecordLockOwner: (recordId: string) => string | null;
  getRecordLockOwnerName: (recordId: string) => string | null;
  acquireRecordLock: (recordId: string, recordType: RecordLock["recordType"]) => Promise<boolean>;
  releaseRecordLock: (recordId: string) => Promise<boolean>;
  sendCollaborationMessage: (type: TeamMessageType, content: string, relatedIncidentId?: string, mentions?: string[]) => Promise<void>;
  markCollabMessageRead: (messageId: string) => Promise<void>;
  publishCollaborationEvent: (type: CollaborationEventType, priority: CollaborationEvent["priority"], title: string, message: string, relatedId?: string) => Promise<void>;
  logCollabActivity: (action: string, incidentId?: string, recId?: string) => Promise<void>;
  toggleNetworkState: () => void;
}

const CollaborationContext = React.createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user configuration (synchronized with the tournament operator session)
  const operatorId = "OP-99";
  const operatorName = "Marcus Aurelius";
  const operatorRole = StaffRole.TOC_OPERATOR;
  
  const [connectionStatus, setConnectionStatus] = React.useState<"connected" | "disconnected" | "reconnecting">("connected");
  const [presences, setPresences] = React.useState<OperatorPresence[]>([]);
  const [locks, setLocks] = React.useState<RecordLock[]>([]);
  const [messages, setMessages] = React.useState<TeamMessage[]>([]);
  const [collabEvents, setCollabEvents] = React.useState<CollaborationEvent[]>([]);
  const [activities, setActivities] = React.useState<CollaborationActivity[]>([]);
  const [offlineQueue, setOfflineQueue] = React.useState<Array<{ id: string; description: string; timestamp: number }>>([]);
  
  const [currentTab, setCurrentTabState] = React.useState<string>("live-ops");
  const [currentActivity, setCurrentActivityState] = React.useState<string>("Monitoring live operations HUD");

  const isConnected = connectionStatus === "connected";

  // Handle manual tab/activity changes with immediate server notification
  const setCurrentTab = React.useCallback((tab: string) => {
    setCurrentTabState(tab);
    let activityText = "Browsing live overview";
    if (tab === "incidents") activityText = "Managing incidents & dispatch";
    if (tab === "copilot") activityText = "Processing AI recommendations";
    if (tab === "logistics") activityText = "Evaluating transit networks";
    if (tab === "analytics") activityText = "Reviewing tournament KPIs";
    setCurrentActivityState(activityText);
    
    if (connectionStatus === "connected") {
      collaborationService.updatePresence(operatorId, { currentPage: tab, activity: activityText });
    }
  }, [connectionStatus]);

  const setCurrentActivity = React.useCallback((activity: string) => {
    setCurrentActivityState(activity);
    if (connectionStatus === "connected") {
      collaborationService.updatePresence(operatorId, { activity });
    }
  }, [connectionStatus]);

  // Sync subscriptions
  React.useEffect(() => {
    const unsubStatus = collaborationService.subscribeToConnectionStatus((status) => {
      setConnectionStatus(status);
      setOfflineQueue(collaborationService.getOfflineQueue());
    });

    const unsubPresence = collaborationService.subscribeToPresence((p) => {
      // Keep own presence updated locally, filter others
      setPresences(p);
    });

    const unsubLocks = collaborationService.subscribeToLocks(setLocks);
    const unsubMessages = collaborationService.subscribeToMessages(setMessages);
    const unsubEvents = collaborationService.subscribeToEvents(setCollabEvents);
    const unsubActivities = collaborationService.subscribeToActivities(setActivities);

    return () => {
      unsubStatus();
      unsubPresence();
      unsubLocks();
      unsubMessages();
      unsubEvents();
      unsubActivities();
    };
  }, []);

  // Update own heartbeats & presence periodically
  React.useEffect(() => {
    const sendHeartbeat = () => {
      if (collaborationService.isConnected()) {
        collaborationService.updatePresence(operatorId, {
          name: operatorName,
          role: operatorRole,
          currentPage: currentTab,
          activity: currentActivity,
          status: "online"
        });
      }
    };

    // Send immediately on load
    sendHeartbeat();
    
    const interval = setInterval(sendHeartbeat, 10000); // Heartbeat every 10 seconds
    return () => clearInterval(interval);
  }, [currentTab, currentActivity, connectionStatus]);

  // Offline queue updater poll
  React.useEffect(() => {
    const queueInterval = setInterval(() => {
      setOfflineQueue(collaborationService.getOfflineQueue());
    }, 2000);
    return () => clearInterval(queueInterval);
  }, []);

  // Locking helper functions
  const isRecordLocked = React.useCallback((recordId: string): boolean => {
    const lock = locks.find(l => l.recordId === recordId);
    if (!lock) return false;
    // Expired locks are treated as unlocked
    if (Date.now() > lock.expiresAt) return false;
    return lock.lockedBy !== operatorId; // Only locked if someone else holds it
  }, [locks]);

  const getRecordLockOwner = React.useCallback((recordId: string): string | null => {
    const lock = locks.find(l => l.recordId === recordId);
    if (!lock || Date.now() > lock.expiresAt) return null;
    return lock.lockedBy;
  }, [locks]);

  const getRecordLockOwnerName = React.useCallback((recordId: string): string | null => {
    const lock = locks.find(l => l.recordId === recordId);
    if (!lock || Date.now() > lock.expiresAt) return null;
    return lock.lockedByName;
  }, [locks]);

  const acquireRecordLock = React.useCallback(async (recordId: string, recordType: RecordLock["recordType"]): Promise<boolean> => {
    const acquired = await collaborationService.acquireLock(recordId, recordType, operatorId, operatorName);
    return acquired;
  }, []);

  const releaseRecordLock = React.useCallback(async (recordId: string): Promise<boolean> => {
    return collaborationService.releaseLock(recordId, operatorId);
  }, []);

  // Messaging helper
  const sendCollaborationMessage = React.useCallback(async (
    type: TeamMessageType, 
    content: string, 
    relatedIncidentId?: string,
    mentions?: string[]
  ): Promise<void> => {
    await collaborationService.sendMessage({
      senderId: operatorId,
      senderName: operatorName,
      senderRole: operatorRole,
      type,
      content,
      relatedIncidentId,
      mentions
    }, () => {
      // Optimistic update local callback
      const optimisticMsg: TeamMessage = {
        id: `OPMSG-${Date.now()}`,
        senderId: operatorId,
        senderName: operatorName,
        senderRole: operatorRole,
        type,
        content,
        timestamp: Date.now(),
        relatedIncidentId,
        mentions,
        readReceipts: [operatorId]
      };
      setMessages(prev => [...prev, optimisticMsg]);
    });
  }, []);

  const markCollabMessageRead = React.useCallback(async (messageId: string): Promise<void> => {
    await collaborationService.markMessageAsRead(messageId, operatorId);
  }, []);

  const publishCollaborationEvent = React.useCallback(async (
    type: CollaborationEventType,
    priority: CollaborationEvent["priority"],
    title: string,
    message: string,
    relatedId?: string
  ): Promise<void> => {
    await collaborationService.publishEvent({
      type,
      priority,
      title,
      message,
      relatedId
    });
  }, []);

  const logCollabActivity = React.useCallback(async (
    action: string, 
    incidentId?: string, 
    recId?: string
  ): Promise<void> => {
    await collaborationService.logActivity({
      operatorId,
      operatorName,
      action,
      relatedIncidentId: incidentId,
      relatedRecommendationId: recId
    });
  }, []);

  // Toggle Network State
  const toggleNetworkState = React.useCallback(() => {
    const nextState = !isConnected;
    collaborationService.simulateNetworkState(nextState);
    setConnectionStatus(nextState ? "connected" : "disconnected");
  }, [isConnected]);

  const value = React.useMemo(() => ({
    connectionStatus,
    presences,
    locks,
    messages,
    collabEvents,
    activities,
    offlineQueue,
    isConnected,
    operatorId,
    operatorName,
    operatorRole,
    currentTab,
    currentActivity,
    setCurrentTab,
    setCurrentActivity,
    isRecordLocked,
    getRecordLockOwner,
    getRecordLockOwnerName,
    acquireRecordLock,
    releaseRecordLock,
    sendCollaborationMessage,
    markCollabMessageRead,
    publishCollaborationEvent,
    logCollabActivity,
    toggleNetworkState
  }), [
    connectionStatus,
    presences,
    locks,
    messages,
    collabEvents,
    activities,
    offlineQueue,
    isConnected,
    currentTab,
    currentActivity,
    setCurrentTab,
    setCurrentActivity,
    isRecordLocked,
    getRecordLockOwner,
    getRecordLockOwnerName,
    acquireRecordLock,
    releaseRecordLock,
    sendCollaborationMessage,
    markCollabMessageRead,
    publishCollaborationEvent,
    logCollabActivity,
    toggleNetworkState
  ]);

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = React.useContext(CollaborationContext);
  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }
  return context;
};
