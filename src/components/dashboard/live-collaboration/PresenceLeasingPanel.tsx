import * as React from "react";
import { 
  Users, Lock, Unlock, Send, MessageSquare, Wifi, WifiOff, Activity, Bell, 
  AlertCircle, Database, RefreshCw, Clock, User, ShieldAlert, Terminal, Cpu, MailCheck
} from "lucide-react";
import { useCollaboration } from "../../../context/CollaborationContext";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { StaffRole } from "../../../types/common";
import { TeamMessageType } from "../../../types/collaboration";

export const PresenceLeasingPanel: React.FC = () => {
  const {
    connectionStatus, presences, locks, isConnected, operatorId, toggleNetworkState, acquireRecordLock, releaseRecordLock, offlineQueue, operatorName, operatorRole, currentTab, currentActivity
  } = useCollaboration();

  const [targetIncidentLock, setTargetIncidentLock] = React.useState("INC-101");
  const [isLocking, setIsLocking] = React.useState(false);
  const [lockError, setLockError] = React.useState<string | null>(null);

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


  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };


  return (
    <>
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

      
    </>
  );
};
