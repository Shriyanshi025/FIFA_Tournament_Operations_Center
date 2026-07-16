/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  Users, 
  Lock, 
  Unlock, 
  Send, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Activity, 
  Bell, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Clock, 
  User, 
  ShieldAlert,
  Terminal,
  Cpu,
  MailCheck
} from "lucide-react";
import { useCollaboration } from "../../context/CollaborationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { StaffRole } from "../../types/common";
import { TeamMessageType } from "../../types/collaboration";

export const LiveCollaborationWidget: React.FC = () => {
  const {
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
    setCurrentActivity,
    isRecordLocked,
    acquireRecordLock,
    releaseRecordLock,
    sendCollaborationMessage,
    markCollabMessageRead,
    publishCollaborationEvent,
    toggleNetworkState
  } = useCollaboration();

  const [messageText, setMessageText] = React.useState("");
  const [messageType, setMessageType] = React.useState<TeamMessageType>("incident_comment");
  const [relatedIncident, setRelatedIncident] = React.useState("");
  const [targetIncidentLock, setTargetIncidentLock] = React.useState("INC-101");
  const [isLocking, setIsLocking] = React.useState(false);
  const [lockError, setLockError] = React.useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = React.useState<"chat" | "events" | "queue" | "activity">("chat");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    try {
      await sendCollaborationMessage(
        messageType,
        messageText.trim(),
        relatedIncident ? relatedIncident.trim() : undefined
      );
      setMessageText("");
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  const handleToggleLock = async () => {
    setIsLocking(true);
    setLockError(null);
    try {
      const isCurrentlyLocked = locks.some(l => l.recordId === targetIncidentLock && Date.now() < l.expiresAt && l.lockedBy === operatorId);
      if (isCurrentlyLocked) {
        await releaseRecordLock(targetIncidentLock);
      } else {
        const success = await acquireRecordLock(targetIncidentLock, "incident");
        if (!success) {
          setLockError(`Lock failed: Record ${targetIncidentLock} is currently leased to another operator.`);
          setTimeout(() => setLockError(null), 5000);
        }
      }
    } catch (err) {
      console.error("Lock toggle failed", err);
      setLockError("Lock toggle failed. Please check connection.");
      setTimeout(() => setLockError(null), 5000);
    } finally {
      setIsLocking(false);
    }
  };

  // Quick preset helper
  const handleTriggerBroadcast = async (priority: "critical" | "high" | "medium", title: string, content: string) => {
    try {
      await publishCollaborationEvent(
        "weather_warning", 
        priority, 
        title, 
        content
      );
    } catch (err) {
      console.error("Event trigger failed:", err);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-md" id="live-collab-widget-layout">
      {/* 1. PRESENCE & REAL-TIME LEASING PANEL */}
      <div className="space-y-md lg:col-span-1">
        {/* Network & Hub Status */}
        <Card shadow="low" className="p-sm bg-surface-hover border border-border/80 space-y-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-wider">COLLABORATION ENGINE STATUS</span>
            <Badge 
              variant={connectionStatus === "connected" ? "success" : connectionStatus === "reconnecting" ? "warning" : "critical"}
              size="sm"
            >
              {connectionStatus.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-xs">
            {isConnected ? (
              <Wifi className="w-md h-md text-secondary animate-pulse-gentle" />
            ) : (
              <WifiOff className="w-md h-md text-error" />
            )}
            <div className="flex-1">
              <span className="block font-sans font-semibold text-caption text-text-primary">
                {isConnected ? "Synchronized Live Ops Mode" : "Local Fallback Offline Mode"}
              </span>
              <span className="block text-[10px] font-mono text-text-secondary leading-tight">
                Channel: <strong className="text-primary font-bold">TOC_MULTICAST_ROOM_1</strong>
              </span>
            </div>
          </div>

          <div className="pt-2xs border-t border-border/40 flex justify-between items-center gap-xs">
            <span className="text-[10px] font-mono text-text-muted">
              {offlineQueue.length > 0 
                ? `⚠️ ${offlineQueue.length} transactions buffered` 
                : "✅ Buffers synchronized"}
            </span>
            <Button 
              variant={isConnected ? "outline" : "warning"}
              size="sm"
              onClick={toggleNetworkState}
              className="text-[10px] font-mono py-1xs min-h-[26px]"
            >
              {isConnected ? "Simulate Disconnect" : "Simulate Reconnect"}
            </Button>
          </div>
        </Card>

        {/* Presence Roster */}
        <Card shadow="low" className="p-md space-y-sm">
          <div className="flex items-center justify-between border-b pb-xs">
            <div className="flex items-center gap-2xs">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-display font-semibold text-caption text-text-primary">Active Command Presence ({presences.length})</h4>
            </div>
            <span className="text-[9px] font-mono text-text-muted animate-pulse-gentle">HB: 10S INTERVAL</span>
          </div>

          <div className="space-y-xs max-h-[240px] overflow-y-auto pr-2xs">
            {/* Render ourselves first */}
            <div className="p-2xs bg-primary/5 border border-primary/20 rounded-sm space-y-1xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-mono text-[9px] font-bold text-primary">
                    ME
                  </div>
                  <div className="text-left">
                    <span className="block text-caption font-bold text-text-primary leading-none">{operatorName}</span>
                    <span className="text-[8px] font-mono text-text-muted uppercase leading-none">{operatorRole}</span>
                  </div>
                </div>
                <Badge variant="success" size="sm" className="scale-90 font-mono">ONLINE</Badge>
              </div>
              <div className="pl-6 border-l-2 border-primary/20 py-[2px]">
                <span className="block text-[10px] font-mono text-text-secondary">
                  Page: <strong className="text-text-primary font-bold">{currentTab.toUpperCase()}</strong>
                </span>
                <span className="block text-[9px] text-text-muted italic truncate" title={currentActivity}>
                  "{currentActivity}"
                </span>
              </div>
            </div>

            {/* Other simulated presences */}
            {presences.filter(p => p.operatorId !== operatorId).map((p) => (
              <div key={p.operatorId} className="p-2xs border border-border/60 rounded-sm space-y-1xs hover:bg-surface-hover/50 transition-colors">
                <div className="flex items-center justify-between gap-xs flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-xs min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-secondary/15 flex items-center justify-center font-mono text-[9px] font-bold text-secondary shrink-0">
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-caption font-bold text-text-primary leading-none truncate">{p.name}</span>
                      <span className="text-[8px] font-mono text-text-muted uppercase leading-none truncate block">{p.role}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={p.status === "online" ? "success" : p.status === "away" ? "warning" : "neutral"} 
                    size="sm" 
                    className="scale-90 font-mono shrink-0 whitespace-nowrap"
                  >
                    {p.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="pl-6 border-l-2 border-border py-[2px]">
                  <span className="block text-[10px] font-mono text-text-secondary">
                    Page: <strong className="text-text-primary">{p.currentPage.toUpperCase()}</strong>
                  </span>
                  <span className="block text-[9px] text-text-muted italic truncate" title={p.activity}>
                    "{p.activity}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Record Locking HUD */}
        <Card shadow="low" className="p-md space-y-sm">
          <div className="flex items-center justify-between border-b pb-xs">
            <div className="flex items-center gap-2xs">
              <Lock className="w-4 h-4 text-warning" />
              <h4 className="font-display font-semibold text-caption text-text-primary">Collision Lock Leases ({locks.length})</h4>
            </div>
            <span className="text-[9px] font-mono text-text-muted">45S AUTO-LEASE</span>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed">
            Record locking prevents multiple operators from editing the same incident concurrently. Locks renew with heartbeats.
          </p>

          {lockError && (
            <div className="text-[10px] font-sans font-semibold text-error bg-error/5 border border-error/20 p-xs rounded-xs flex items-center gap-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{lockError}</span>
            </div>
          )}

          <div className="space-y-xs bg-background/40 p-xs border rounded-sm">
            <div className="flex gap-xs items-center">
              <select
                value={targetIncidentLock}
                onChange={(e) => setTargetIncidentLock(e.target.value)}
                className="flex-1 text-[11px] bg-background border border-border rounded-xs px-sm py-[4px] font-mono text-text-primary cursor-pointer focus:outline-none"
              >
                {["INC-101", "INC-102", "INC-103", "INC-104", "INC-105"].map(id => (
                  <option key={id} value={id}>Incident {id}</option>
                ))}
              </select>
              
              <Button
                variant={locks.some(l => l.recordId === targetIncidentLock && Date.now() < l.expiresAt && l.lockedBy === operatorId) ? "danger" : "outline"}
                size="sm"
                onClick={handleToggleLock}
                isLoading={isLocking}
                className="text-[10px] font-mono py-1xs min-h-[30px]"
              >
                {locks.some(l => l.recordId === targetIncidentLock && Date.now() < l.expiresAt && l.lockedBy === operatorId) ? (
                  <Unlock className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>
                  {locks.some(l => l.recordId === targetIncidentLock && Date.now() < l.expiresAt && l.lockedBy === operatorId) ? "Unlock" : "Acquire"}
                </span>
              </Button>
            </div>

            {/* List locks */}
            <div className="pt-2xs border-t border-border/30 space-y-[4px]">
              {locks.length === 0 ? (
                <div className="text-[10px] font-mono text-text-muted text-center py-xs">
                  No active operational locks.
                </div>
              ) : (
                locks.map((lock) => {
                  const isMine = lock.lockedBy === operatorId;
                  const timeRemaining = Math.max(0, Math.round((lock.expiresAt - Date.now()) / 1000));
                  return (
                    <div key={lock.recordId} className="flex items-center justify-between text-[10px] font-mono bg-surface p-1xs rounded-xs border gap-xs flex-wrap sm:flex-nowrap">
                      <span className="font-bold text-text-primary uppercase shrink-0">{lock.recordId}</span>
                      <div className="text-right flex items-center gap-xs min-w-0">
                        <span className={`truncate block leading-none ${isMine ? "text-primary font-bold" : "text-text-secondary"}`}>
                          {isMine ? "You" : lock.lockedByName}
                        </span>
                        <Badge variant={isMine ? "success" : "warning"} size="sm" className="scale-90 shrink-0 whitespace-nowrap">
                          {timeRemaining}s Left
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 2. TEAM MESSAGES & COMMUNICATION CARD */}
      <div className="lg:col-span-2 flex flex-col space-y-md">
        <Card shadow="low" className="p-md flex-1 flex flex-col min-h-[480px]">
          {/* Sub Tab selection */}
          <div className="flex border-b pb-xs justify-between items-center shrink-0 mb-sm">
            <div className="flex gap-sm">
              <button
                onClick={() => setActiveSubTab("chat")}
                className={`pb-xs font-display font-semibold text-caption transition-all cursor-pointer border-b-2 text-[12px] ${
                  activeSubTab === "chat" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                💬 Operational Broadcasts
              </button>
              <button
                onClick={() => setActiveSubTab("events")}
                className={`pb-xs font-display font-semibold text-caption transition-all cursor-pointer border-b-2 text-[12px] ${
                  activeSubTab === "events" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                🚨 Live Alerts
              </button>
              <button
                onClick={() => setActiveSubTab("activity")}
                className={`pb-xs font-display font-semibold text-caption transition-all cursor-pointer border-b-2 text-[12px] ${
                  activeSubTab === "activity" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                📜 Audit Timeline
              </button>
              <button
                onClick={() => setActiveSubTab("queue")}
                className={`pb-xs font-display font-semibold text-caption transition-all cursor-pointer border-b-2 text-[12px] relative ${
                  activeSubTab === "queue" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                📦 Offline Buffer
                {offlineQueue.length > 0 && (
                  <span className="absolute -top-xs -right-xs bg-warning text-warning-fg w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-mono font-bold animate-pulse-gentle">
                    {offlineQueue.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ACTIVE CONTENT WORKSPACE */}
          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-sm pr-xs" id="collaboration-workspace-scroller">
            
            {/* SUBTAB: CHAT */}
            {activeSubTab === "chat" && (
              <div className="space-y-xs">
                {messages.length === 0 ? (
                  <div className="text-center text-text-muted py-xl font-mono text-caption">
                    No operational comments sent. Start by sending a command broadcast.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === operatorId;
                    const isEmergency = msg.type === "emergency_broadcast";
                    const isComment = msg.type === "incident_comment";
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`p-2xs rounded-sm border text-left space-y-[2px] transition-colors ${
                          isEmergency 
                            ? "bg-error/5 border-error/30" 
                            : isOwn 
                            ? "bg-primary/5 border-primary/20" 
                            : "bg-background/80 border-border/60"
                        }`}
                        onMouseEnter={() => markCollabMessageRead(msg.id)}
                      >
                        <div className="flex items-center justify-between gap-xs flex-wrap">
                          <div className="flex items-center gap-xs flex-wrap min-w-0">
                            <span className="font-bold text-caption text-text-primary truncate block max-w-[140px] xs:max-w-none">
                              {msg.senderName} 
                              <span className="font-mono text-[9px] text-text-muted font-normal ml-xs">
                                ({msg.senderRole})
                              </span>
                            </span>
                            <Badge 
                              variant={
                                isEmergency 
                                  ? "critical" 
                                  : msg.type === "department_broadcast" 
                                  ? "warning" 
                                  : isComment 
                                  ? "info" 
                                  : "neutral"
                              } 
                              size="sm"
                              className="scale-90 uppercase font-mono shrink-0 whitespace-nowrap"
                            >
                              {msg.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="text-[8px] font-mono text-text-muted shrink-0">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>

                        <p className="text-caption text-text-secondary leading-relaxed pl-xs border-l-2 border-border mt-[2px]">
                          {/* Parse simple mentions */}
                          {msg.content.includes("@") ? (
                            <span>
                              {msg.content.split(" ").map((word, i) => {
                                if (word.startsWith("@")) {
                                  return <strong key={i} className="text-primary font-mono bg-primary/10 px-[2px] rounded-xs mr-1xs">{word}</strong>;
                                }
                                return word + " ";
                              })}
                            </span>
                          ) : (
                            msg.content
                          )}
                        </p>

                        <div className="flex items-center justify-between pt-[2px] text-[8px] font-mono text-text-muted">
                          <div>
                            {msg.relatedIncidentId && (
                              <span className="bg-background border px-xs py-[2px] rounded-xs font-bold uppercase text-primary">
                                RELATED: {msg.relatedIncidentId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1xs">
                            <MailCheck className="w-3 h-3 text-secondary" />
                            <span>Seen by: {msg.readReceipts.map(id => id === operatorId ? "You" : id).join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SUBTAB: EVENTS */}
            {activeSubTab === "events" && (
              <div className="space-y-xs">
                {collabEvents.length === 0 ? (
                  <div className="text-center text-text-muted py-xl font-mono text-caption">
                    No active collaborative alert signals.
                  </div>
                ) : (
                  collabEvents.map((evt) => (
                    <div 
                      key={evt.id} 
                      className={`p-2xs rounded-sm border-l-4 text-left flex gap-xs items-start ${
                        evt.priority === "critical" 
                          ? "bg-error/5 border-l-error border" 
                          : evt.priority === "high" 
                          ? "bg-warning/5 border-l-warning border" 
                          : "bg-background/80 border-l-primary border"
                      }`}
                    >
                      <ShieldAlert className={`w-5 h-5 mt-2xs shrink-0 ${
                        evt.priority === "critical" ? "text-error" : evt.priority === "high" ? "text-warning" : "text-primary"
                      }`} />
                      <div className="flex-1 space-y-1xs min-w-0">
                        <div className="flex justify-between items-center gap-xs flex-wrap">
                          <span className="font-bold text-caption text-text-primary leading-none truncate block">{evt.title}</span>
                          <span className="text-[9px] font-mono text-text-muted shrink-0">{formatTime(evt.timestamp)}</span>
                        </div>
                        <p className="text-caption text-text-secondary leading-relaxed">{evt.message}</p>
                        <div className="flex gap-xs items-center flex-wrap">
                          <Badge variant={evt.priority === "critical" ? "critical" : evt.priority === "high" ? "warning" : "neutral"} size="sm" className="font-mono scale-95 uppercase shrink-0 whitespace-nowrap">
                            {evt.priority} Priority
                          </Badge>
                          <span className="text-[9px] font-mono text-text-muted shrink-0">Signal Ref: {evt.id}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Simulated quick broadcast controls */}
                <div className="p-xs border border-dashed rounded-md space-y-xs mt-sm">
                  <span className="block font-mono text-[9px] font-bold text-text-muted uppercase">BROADCAST SIMULATOR CONTROL</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-xs">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTriggerBroadcast("critical", "CRITICAL METRO SYSTEM BOTTLENECK", "Major gridlock reported at Gate Alpha central line turnstiles. Emergency trains dispatched.")}
                      className="text-[9px] font-mono py-1xs min-h-[30px]"
                    >
                      🚨 Critical Broadcast
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTriggerBroadcast("high", "MEDIC CREW ROTATION", "Heat fatigue patrols rotating out of South concourse. Substitution squads dispatched.")}
                      className="text-[9px] font-mono py-1xs min-h-[30px]"
                    >
                      ⚠️ High Priority Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTriggerBroadcast("medium", "WEATHER ADVISORY: WINDS GUSTING", "Anemometer readings indicate 35km/h wind gusts. Gate signage secured.")}
                      className="text-[9px] font-mono py-1xs min-h-[30px]"
                    >
                      💨 Weather Warning
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: TIMELINE */}
            {activeSubTab === "activity" && (
              <div className="space-y-xs">
                {activities.length === 0 ? (
                  <div className="text-center text-text-muted py-xl font-mono text-caption">
                    No historic activities logged.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-2xs bg-background/50 border rounded-sm flex items-center justify-between text-[11px] font-mono text-left hover:bg-surface-hover/30 transition-colors">
                      <div className="space-y-1xs">
                        <div className="flex items-center gap-xs">
                          <span className="font-bold text-text-primary uppercase">{act.operatorName}</span>
                          <span className="text-text-muted">|</span>
                          <span className="text-text-secondary">{act.action}</span>
                        </div>
                        {act.relatedIncidentId && (
                          <span className="text-[9px] bg-background border rounded px-1xs text-primary font-bold">
                            Incident Ref: {act.relatedIncidentId}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-text-muted shrink-0">
                        {formatTime(act.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB: OFFLINE QUEUE */}
            {activeSubTab === "queue" && (
              <div className="space-y-sm text-left">
                <div className="p-xs bg-background border rounded-md">
                  <span className="block font-mono text-[10px] text-text-secondary font-bold uppercase mb-2xs">OFFLINE TRANSACTION FLOW</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    This demonstrates our <strong>Offline Resilience Engine</strong>. When you disconnect the collaboration hub, all messages, presence edits, and activity logging are held inside an in-memory queue. They auto-replay chronologically with merge strategies once connection is restored!
                  </p>
                </div>

                <div className="space-y-xs">
                  {offlineQueue.length === 0 ? (
                    <div className="p-lg border border-dashed border-border rounded-md text-center text-text-muted font-mono text-caption">
                      No transactions buffered. Hub is connected and synchronous. Toggle "Simulate Disconnect" to try buffering offline actions!
                    </div>
                  ) : (
                    offlineQueue.map((op) => (
                      <div key={op.id} className="p-2xs bg-warning/5 border border-warning/30 rounded-sm flex items-center justify-between font-mono text-[10px]">
                        <div>
                          <span className="font-bold text-warning uppercase block">{op.id}</span>
                          <span className="text-text-secondary">{op.description}</span>
                        </div>
                        <Badge variant="warning" size="sm" className="animate-pulse-gentle">BUFFERED</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* BOTTOM INTERACTIVE INPUT FIELD */}
          {activeSubTab === "chat" && (
            <form onSubmit={handleSendMessage} className="pt-sm border-t border-border mt-auto shrink-0 space-y-xs">
              <div className="flex flex-col sm:flex-row gap-xs items-center">
                <div className="flex gap-xs items-center w-full sm:w-auto">
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as TeamMessageType)}
                    className="text-[11px] bg-background border border-border rounded-xs px-sm py-1xs font-mono text-text-primary cursor-pointer focus:outline-none"
                  >
                    <option value="incident_comment">💬 Comment</option>
                    <option value="internal_note">📝 Internal Note</option>
                    <option value="department_broadcast">📢 Broadcast</option>
                    <option value="emergency_broadcast">🚨 Emergency</option>
                  </select>

                  <select
                    value={relatedIncident}
                    onChange={(e) => setRelatedIncident(e.target.value)}
                    className="text-[11px] bg-background border border-border rounded-xs px-sm py-1xs font-mono text-text-primary cursor-pointer focus:outline-none"
                  >
                    <option value="">No Incident Ref</option>
                    <option value="INC-101">Ref INC-101</option>
                    <option value="INC-102">Ref INC-102</option>
                    <option value="INC-103">Ref INC-103</option>
                  </select>
                </div>

                {/* Mentions quick injection preset */}
                <div className="flex gap-xs text-[9px] font-mono text-text-muted">
                  <span>Quick tag:</span>
                  <button type="button" onClick={() => setMessageText(prev => prev + " @SECURITY")} className="hover:text-primary underline cursor-pointer">@SECURITY</button>
                  <button type="button" onClick={() => setMessageText(prev => prev + " @TOC")} className="hover:text-primary underline cursor-pointer">@TOC</button>
                  <button type="button" onClick={() => setMessageText(prev => prev + " @VENUE")} className="hover:text-primary underline cursor-pointer">@VENUE</button>
                </div>
              </div>

              <div className="flex gap-xs">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter operational message broadcast (e.g. @SECURITY deploy standby squad)..."
                  className="flex-1 bg-background border border-border rounded-xs px-sm py-xs text-caption text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button 
                  type="submit"
                  variant={messageType === "emergency_broadcast" ? "danger" : "primary"}
                  size="sm"
                  className="px-md text-xs font-bold gap-2xs"
                  disabled={!messageText.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
