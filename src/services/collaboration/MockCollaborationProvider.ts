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
  SyncStatePayload,
  OperatorStatus
} from "../../types/collaboration";
import { StaffRole } from "../../types/common";

export class MockCollaborationProvider implements CollaborationProvider {
  public readonly name = "MockCollaborationProvider";
  
  private connected: boolean = true;
  private onStatusChangeCallback: ((status: "connected" | "disconnected" | "reconnecting") => void) | null = null;
  
  // Storage for our simulated "server"
  private presences: OperatorPresence[] = [];
  private locks: RecordLock[] = [];
  private messages: TeamMessage[] = [];
  private events: CollaborationEvent[] = [];
  private activities: CollaborationActivity[] = [];
  
  // Callback subscribers
  private presenceSubscribers: Set<(presences: OperatorPresence[]) => void> = new Set();
  private lockSubscribers: Set<(locks: RecordLock[]) => void> = new Set();
  private messageSubscribers: Set<(messages: TeamMessage[]) => void> = new Set();
  private eventSubscribers: Set<(events: CollaborationEvent[]) => void> = new Set();
  private activitySubscribers: Set<(activities: CollaborationActivity[]) => void> = new Set();
  
  // Timer for simulating other users' behaviors
  private simulationInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initializeMockData();
    this.startSimulation();
  }

  private initializeMockData() {
    const now = Date.now();
    
    // Initial presences of other operators
    this.presences = [
      {
        operatorId: "OP-01",
        name: "Sarah Jenkins",
        role: StaffRole.VENUE_STAFF,
        currentPage: "live-ops",
        activity: "Monitoring Gate Bravo flow",
        lastHeartbeat: now,
        status: "online"
      },
      {
        operatorId: "OP-02",
        name: "Lt. James Vance",
        role: StaffRole.SECURITY,
        currentPage: "incidents",
        assignedIncidentId: "INC-102",
        activity: "Coordinating dispatch for sector B",
        lastHeartbeat: now - 5000,
        status: "online"
      },
      {
        operatorId: "OP-03",
        name: "Elena Rostova",
        role: StaffRole.TOC_OPERATOR,
        currentPage: "logistics",
        activity: "Reviewing metro line capacity",
        lastHeartbeat: now - 30000,
        status: "away"
      }
    ];

    // Initial messages
    this.messages = [
      {
        id: "MSG-01",
        senderId: "OP-02",
        senderName: "Lt. James Vance",
        senderRole: StaffRole.SECURITY,
        type: "incident_comment",
        content: "Security personnel positioned at Gate Bravo to assist with crowd management.",
        timestamp: now - 180000,
        relatedIncidentId: "INC-101",
        readReceipts: ["OP-01", "OP-03"]
      },
      {
        id: "MSG-02",
        senderId: "OP-03",
        senderName: "Elena Rostova",
        senderRole: StaffRole.TOC_OPERATOR,
        type: "department_broadcast",
        content: "Metro dispatch confirmed 3 additional shuttle trains on standby for post-match dispersal.",
        timestamp: now - 120000,
        recipientDepartments: ["TOC", "VENUE"],
        readReceipts: ["OP-01", "OP-02"]
      }
    ];

    // Initial events
    this.events = [
      {
        id: "EVT-01",
        type: "weather_warning",
        priority: "medium",
        title: "Wind Advisory Active",
        message: "Slight delay reported in standard gate screening due to gusting wind",
        timestamp: now - 600000
      }
    ];

    // Initial activities
    this.activities = [
      {
        id: "ACT-01",
        operatorId: "OP-02",
        operatorName: "Lt. James Vance",
        action: "Assigned Security Squad 4 to Incident INC-102",
        timestamp: now - 150000,
        relatedIncidentId: "INC-102"
      }
    ];
  }

  private startSimulation() {
    this.simulationInterval = setInterval(() => {
      if (!this.connected) return;
      
      const now = Date.now();
      const rand = Math.random();
      
      // 1. Simulating heartbeat & random presence update of other operators
      if (rand < 0.4) {
        const opIdx = Math.floor(Math.random() * this.presences.length);
        const op = this.presences[opIdx];
        
        const activities = [
          "Updating incident triage details",
          "Analyzing crowd gate throughput",
          "Responding to AI Copilot queries",
          "Updating dispatch log summaries",
          "Monitoring environmental telemetry",
          "Resting"
        ];
        
        const pages = ["live-ops", "incidents", "copilot", "logistics", "analytics"];
        const statuses: OperatorStatus[] = ["online", "away"];
        
        op.currentPage = pages[Math.floor(Math.random() * pages.length)];
        op.activity = activities[Math.floor(Math.random() * activities.length)];
        op.lastHeartbeat = now;
        op.status = Math.random() < 0.85 ? "online" : "away";
        
        this.notifyPresence();
      }

      // 2. Simulating record locking & unlocking
      if (rand >= 0.4 && rand < 0.6) {
        // Find if someone already has a lock
        if (this.locks.length > 0 && Math.random() < 0.5) {
          // Release a random lock
          const released = this.locks.shift();
          if (released) {
            this.logAndPublishActivity(
              released.lockedBy,
              released.lockedByName,
              `Released edit lock for ${released.recordType} ${released.recordId}`
            );
            this.notifyLocks();
          }
        } else {
          // Create a new lock by OP-01 or OP-02
          const randomOp = this.presences[Math.floor(Math.random() * 2)];
          const recordId = `INC-10${Math.floor(Math.random() * 5) + 1}`;
          
          // Verify it's not locked
          if (!this.locks.some(l => l.recordId === recordId)) {
            const newLock: RecordLock = {
              recordId,
              recordType: "incident",
              lockedBy: randomOp.operatorId,
              lockedByName: randomOp.name,
              lockedAt: now,
              expiresAt: now + 60000 // 1 minute expiry
            };
            this.locks.push(newLock);
            this.logAndPublishActivity(
              randomOp.operatorId,
              randomOp.name,
              `Acquired edit lock for incident ${recordId}`,
              recordId
            );
            this.notifyLocks();
          }
        }
      }

      // 3. Simulating random messages
      if (rand >= 0.6 && rand < 0.75) {
        const randomOp = this.presences[Math.floor(Math.random() * this.presences.length)];
        const msgs = [
          "Gate Alpha queue is dispersing cleanly.",
          "Incident INC-102 team arrived on scene. Assessing medical triage status.",
          "Minor congestion near West Promenade. Directing volunteers for guidance.",
          "Approved recommendation on Gate Bravo reroute. Commencing operational sequence."
        ];
        
        const isIncident = Math.random() < 0.5;
        const msg: TeamMessage = {
          id: `MSG-${Date.now()}`,
          senderId: randomOp.operatorId,
          senderName: randomOp.name,
          senderRole: randomOp.role,
          type: isIncident ? "incident_comment" : "internal_note",
          content: msgs[Math.floor(Math.random() * msgs.length)],
          timestamp: now,
          relatedIncidentId: isIncident ? `INC-10${Math.floor(Math.random() * 3) + 1}` : undefined,
          readReceipts: [randomOp.operatorId]
        };
        
        this.messages.push(msg);
        this.notifyMessages();
      }

      // 4. Simulating live alerts/events
      if (rand >= 0.75) {
        const alerts = [
          {
            type: "weather_warning" as const,
            priority: "high" as const,
            title: "Severe Heat Advisory Update",
            message: "TOC deploying hydration units to Sector C due to localized heat readings."
          },
          {
            type: "incident_escalated" as const,
            priority: "critical" as const,
            title: "Incident Escalation: INC-104",
            message: "Incident elevated to CRITICAL severity. Dispatching emergency unit."
          },
          {
            type: "transport_disruption" as const,
            priority: "medium" as const,
            title: "Metro Delay Reported",
            message: "Green Line holding trains at Central Hub. Estimated recovery: 15 mins."
          },
          {
            type: "medical_emergency" as const,
            priority: "high" as const,
            title: "Medical Dispatch Needed",
            message: "Heat fatigue report at Block 24. First response team dispatched."
          }
        ];
        
        const selectedAlert = alerts[Math.floor(Math.random() * alerts.length)];
        const event: CollaborationEvent = {
          id: `EVT-${Date.now()}`,
          ...selectedAlert,
          timestamp: now
        };
        
        this.events.unshift(event);
        this.notifyEvents();
      }
    }, 12000);

    // Heartbeat check for stale users (cleanup offline)
    this.heartbeatInterval = setInterval(() => {
      if (!this.connected) return;
      const now = Date.now();
      let changed = false;
      
      this.presences = this.presences.map(p => {
        if (p.status !== "offline" && now - p.lastHeartbeat > 40000) {
          changed = true;
          return { ...p, status: "offline" as const };
        }
        return p;
      });
      
      if (changed) {
        this.notifyPresence();
      }
    }, 20000);
  }

  private logAndPublishActivity(
    opId: string, 
    opName: string, 
    action: string, 
    incidentId?: string,
    recId?: string,
    workflowId?: string
  ) {
    const act: CollaborationActivity = {
      id: `ACT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      operatorId: opId,
      operatorName: opName,
      action,
      timestamp: Date.now(),
      relatedIncidentId: incidentId,
      relatedRecommendationId: recId,
      relatedWorkflowId: workflowId
    };
    
    this.activities.unshift(act);
    this.notifyActivities();
  }

  // Connection management
  public async connect(onStatusChange: (status: "connected" | "disconnected" | "reconnecting") => void): Promise<void> {
    this.onStatusChangeCallback = onStatusChange;
    this.connected = true;
    onStatusChange("connected");
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback("disconnected");
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  // Trigger manual network failure/recovery to showcase offline buffering
  public triggerManualNetworkState(online: boolean) {
    this.connected = online;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(online ? "connected" : "disconnected");
    }
    
    if (online) {
      // Reconnected, notify subscribers
      this.notifyAll();
    }
  }

  // Subscriber notification triggers
  private notifyPresence() {
    this.presenceSubscribers.forEach(cb => cb([...this.presences]));
  }
  
  private notifyLocks() {
    this.lockSubscribers.forEach(cb => cb([...this.locks]));
  }
  
  private notifyMessages() {
    this.messageSubscribers.forEach(cb => cb([...this.messages]));
  }
  
  private notifyEvents() {
    this.eventSubscribers.forEach(cb => cb([...this.events]));
  }
  
  private notifyActivities() {
    this.activitySubscribers.forEach(cb => cb([...this.activities]));
  }

  private notifyAll() {
    this.notifyPresence();
    this.notifyLocks();
    this.notifyMessages();
    this.notifyEvents();
    this.notifyActivities();
  }

  // Subscriptions APIs
  public subscribeToPresence(callback: (presences: OperatorPresence[]) => void): () => void {
    this.presenceSubscribers.add(callback);
    callback([...this.presences]); // Instant first callback
    return () => this.presenceSubscribers.delete(callback);
  }

  public subscribeToLocks(callback: (locks: RecordLock[]) => void): () => void {
    this.lockSubscribers.add(callback);
    callback([...this.locks]);
    return () => this.lockSubscribers.delete(callback);
  }

  public subscribeToMessages(callback: (messages: TeamMessage[]) => void): () => void {
    this.messageSubscribers.add(callback);
    callback([...this.messages]);
    return () => this.messageSubscribers.delete(callback);
  }

  public subscribeToEvents(callback: (events: CollaborationEvent[]) => void): () => void {
    this.eventSubscribers.add(callback);
    callback([...this.events]);
    return () => this.eventSubscribers.delete(callback);
  }

  public subscribeToActivities(callback: (activities: CollaborationActivity[]) => void): () => void {
    this.activitySubscribers.add(callback);
    callback([...this.activities]);
    return () => this.activitySubscribers.delete(callback);
  }

  // Mutation actions
  public async updatePresence(operatorId: string, presence: Partial<OperatorPresence>): Promise<void> {
    if (!this.connected) {
      throw new Error("Network offline. Operation queued locally.");
    }
    
    const idx = this.presences.findIndex(p => p.operatorId === operatorId);
    if (idx >= 0) {
      this.presences[idx] = {
        ...this.presences[idx],
        ...presence,
        lastHeartbeat: Date.now()
      };
    } else {
      // Add as new
      const defaultPresence: OperatorPresence = {
        operatorId,
        name: presence.name || "TOC Operator",
        role: presence.role || StaffRole.TOC_OPERATOR,
        currentPage: presence.currentPage || "live-ops",
        activity: presence.activity || "Logged on",
        lastHeartbeat: Date.now(),
        status: presence.status || "online"
      };
      this.presences.push(defaultPresence);
    }
    
    this.notifyPresence();
  }

  public async acquireLock(
    recordId: string, 
    recordType: RecordLock["recordType"], 
    operatorId: string, 
    operatorName: string
  ): Promise<boolean> {
    if (!this.connected) {
      throw new Error("Network offline. Lock operation rejected.");
    }
    
    const existingIndex = this.locks.findIndex(l => l.recordId === recordId);
    const now = Date.now();
    
    if (existingIndex >= 0) {
      const lock = this.locks[existingIndex];
      // Check if expired
      if (now > lock.expiresAt) {
        // Safe to override
        this.locks[existingIndex] = {
          recordId,
          recordType,
          lockedBy: operatorId,
          lockedByName: operatorName,
          lockedAt: now,
          expiresAt: now + 45000 // 45 seconds lock lease
        };
        this.logAndPublishActivity(operatorId, operatorName, `Overrode expired edit lock on ${recordType} ${recordId}`, recordId);
        this.notifyLocks();
        return true;
      }
      
      // If it belongs to same operator, extend lease
      if (lock.lockedBy === operatorId) {
        lock.expiresAt = now + 45000;
        this.notifyLocks();
        return true;
      }
      
      // Locked by someone else - CONFLICT!
      return false;
    }
    
    // No existing lock, acquire cleanly
    this.locks.push({
      recordId,
      recordType,
      lockedBy: operatorId,
      lockedByName: operatorName,
      lockedAt: now,
      expiresAt: now + 45000
    });
    
    this.logAndPublishActivity(operatorId, operatorName, `Acquired edit lock for ${recordType} ${recordId}`, recordId);
    this.notifyLocks();
    return true;
  }

  public async releaseLock(recordId: string, operatorId: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error("Network offline. Unlock rejected.");
    }
    
    const idx = this.locks.findIndex(l => l.recordId === recordId);
    if (idx >= 0) {
      const lock = this.locks[idx];
      if (lock.lockedBy === operatorId) {
        this.locks.splice(idx, 1);
        this.logAndPublishActivity(operatorId, lock.lockedByName, `Released edit lock for ${lock.recordType} ${recordId}`, recordId);
        this.notifyLocks();
        return true;
      }
    }
    return false;
  }

  public async sendMessage(message: Omit<TeamMessage, "id" | "timestamp" | "readReceipts">): Promise<TeamMessage> {
    if (!this.connected) {
      throw new Error("Network offline. Message queued locally.");
    }
    
    const newMessage: TeamMessage = {
      id: `MSG-${Date.now()}`,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      type: message.type,
      content: message.content,
      timestamp: Date.now(),
      relatedIncidentId: message.relatedIncidentId,
      mentions: message.mentions,
      recipientDepartments: message.recipientDepartments,
      readReceipts: [message.senderId]
    };
    
    this.messages.push(newMessage);
    this.logAndPublishActivity(
      message.senderId, 
      message.senderName, 
      `Sent ${message.type.replace("_", " ")}: "${message.content.substring(0, 30)}..."`, 
      message.relatedIncidentId
    );
    this.notifyMessages();
    return newMessage;
  }

  public async markMessageAsRead(messageId: string, operatorId: string): Promise<void> {
    if (!this.connected) return; // Silent discard/defer if offline for read receipts
    
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      const msg = this.messages[idx];
      if (!msg.readReceipts.includes(operatorId)) {
        msg.readReceipts.push(operatorId);
        this.notifyMessages();
      }
    }
  }

  public async publishEvent(event: Omit<CollaborationEvent, "id" | "timestamp">): Promise<CollaborationEvent> {
    if (!this.connected) {
      throw new Error("Network offline. Event broadcast deferred.");
    }
    
    const newEvent: CollaborationEvent = {
      id: `EVT-${Date.now()}`,
      ...event,
      timestamp: Date.now()
    };
    
    this.events.unshift(newEvent);
    this.notifyEvents();
    return newEvent;
  }

  public async logActivity(activity: Omit<CollaborationActivity, "id" | "timestamp">): Promise<CollaborationActivity> {
    const newAct: CollaborationActivity = {
      id: `ACT-${Date.now()}`,
      ...activity,
      timestamp: Date.now()
    };
    
    this.activities.unshift(newAct);
    this.notifyActivities();
    return newAct;
  }

  public async syncState(payload: SyncStatePayload): Promise<Record<string, any>> {
    if (!this.connected) {
      throw new Error("Sync failed. Server unreachable.");
    }
    
    // Simulate state reconciliation returning synchronized items
    return {
      syncedAt: Date.now(),
      serverVersion: "1.2.0",
      actionsReplayed: payload.entities.incidents?.length || 0,
      locks: this.locks,
      presence: this.presences
    };
  }
  
  public destroy() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
}
