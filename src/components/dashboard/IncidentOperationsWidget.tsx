/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, RefreshCw, Lock } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { Severity, IncidentStatus } from "../../types";
import { Badge } from "../ui/Badge";
import { useCollaboration } from "../../context/CollaborationContext";

const IncidentSLATimer: React.FC<{ createdAt: string; severity: Severity; status: IncidentStatus; simTime: string }> = ({ createdAt, severity, status, simTime }) => {
  const [now, setNow] = React.useState<Date>(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  let slaSeconds = 1800; // 30 mins default
  if (severity === Severity.CRITICAL) {
    slaSeconds = 900; // 15 mins
  } else if (severity === Severity.WARNING) {
    slaSeconds = 1800; // 30 mins
  } else if (severity === Severity.INFORMATIONAL) {
    slaSeconds = 3600; // 60 mins
  }

  const createdDate = new Date(createdAt);
  const currentDate = simTime ? new Date(simTime) : now;
  
  const elapsedSeconds = Math.max(0, Math.floor((currentDate.getTime() - createdDate.getTime()) / 1000));
  const remainingSeconds = slaSeconds - elapsedSeconds;
  const isBreached = remainingSeconds <= 0;

  if (status === IncidentStatus.RESOLVED) {
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    return (
      <span className="font-mono text-[9px] font-bold text-success bg-success/10 px-xs py-[2px] rounded-xs uppercase">
        SLA Met ({elapsedMinutes}m response)
      </span>
    );
  }

  let timerColor = "text-success bg-success/10 border-success/20";
  let urgencyText = "Nominal";
  if (isBreached) {
    timerColor = "text-error bg-error/10 border-error/20 animate-pulse";
    urgencyText = "BREACHED";
  } else if (remainingSeconds < slaSeconds * 0.25) {
    timerColor = "text-error bg-error/10 border-error/20 animate-pulse-gentle font-bold";
    urgencyText = "CRITICAL LIMIT";
  } else if (remainingSeconds < slaSeconds * 0.5) {
    timerColor = "text-warning bg-warning/10 border-warning/20";
    urgencyText = "Warning Level";
  }

  const absoluteRemaining = Math.abs(remainingSeconds);
  const hrs = Math.floor(absoluteRemaining / 3600);
  const mins = Math.floor((absoluteRemaining % 3600) / 60);
  const secs = absoluteRemaining % 60;

  const timeString = `${isBreached ? "-" : ""}${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const predictedMinutes = severity === Severity.CRITICAL ? "2.5m" : severity === Severity.WARNING ? "5.0m" : "8.0m";

  return (
    <div className="space-y-[2px] text-right">
      <div className={`inline-flex items-center gap-xs border px-xs py-[1px] rounded-xs font-mono text-[10px] font-bold ${timerColor}`} id={`sla-timer-${createdAt}`}>
        <Clock className="w-3 h-3" />
        <span>SLA: {timeString}</span>
        <span className="text-[8px] opacity-75 uppercase">({urgencyText})</span>
      </div>
      <div className="text-[8px] font-mono text-text-muted">
        Est. Resolve: <span className="text-secondary font-bold">{predictedMinutes}</span>
      </div>
    </div>
  );
};

export const IncidentOperationsWidget: React.FC = () => {
  const { incidents, isLoading, updateIncidentStatus, simulationEngineState } = useTournament();
  const collab = useCollaboration();
  const [filter, setFilter] = React.useState<"ALL" | "OPEN" | "RESOLVED">("ALL");

  // Calculations for metrics
  const summary = React.useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status !== IncidentStatus.RESOLVED).length;
    const resolved = incidents.filter((i) => i.status === IncidentStatus.RESOLVED).length;
    const critical = incidents.filter((i) => i.severity === Severity.CRITICAL && i.status !== IncidentStatus.RESOLVED).length;
    const high = incidents.filter((i) => i.severity === Severity.WARNING && i.status !== IncidentStatus.RESOLVED).length;

    // Severity counts
    const counts = {
      [Severity.CRITICAL]: incidents.filter((i) => i.severity === Severity.CRITICAL).length,
      [Severity.WARNING]: incidents.filter((i) => i.severity === Severity.WARNING).length,
      [Severity.INFORMATIONAL]: incidents.filter((i) => i.severity === Severity.INFORMATIONAL).length
    };

    return { total, open, resolved, critical, high, counts };
  }, [incidents]);

  const displayedIncidents = React.useMemo(() => {
    let list = [...incidents];
    if (filter === "OPEN") {
      list = list.filter((i) => i.status !== IncidentStatus.RESOLVED);
    } else if (filter === "RESOLVED") {
      list = list.filter((i) => i.status === IncidentStatus.RESOLVED);
    }
    // Sort by descending date
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [incidents, filter]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Syncing incident registry data...
      </div>
    );
  }

  const handleResolve = async (id: string) => {
    try {
      await updateIncidentStatus(id, IncidentStatus.RESOLVED);
    } catch (e) {
      console.error("Failed to resolve incident from dashboard:", e);
    }
  };

  return (
    <div className="space-y-lg" id="incident-operations-dashboard">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm" id="incidents-stat-grid">
        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Total Incidents Logged</span>
          <span className="text-h2 font-display font-bold text-text-primary mt-1xs block">{summary.total}</span>
        </div>
        
        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Active Open Logs</span>
          <span className="text-h2 font-display font-bold text-accent mt-1xs block">{summary.open}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center animate-pulse-gentle">
          <span className="font-mono text-[9px] text-error uppercase block">Active CRITICAL</span>
          <span className="text-h2 font-display font-bold text-error mt-1xs block">{summary.critical}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-success uppercase block">Resolved Safely</span>
          <span className="text-h2 font-display font-bold text-success mt-1xs block">{summary.resolved}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Severity Distribution Column (1/3 Width) */}
        <div className="border p-md bg-surface rounded-md space-y-md text-left" id="severity-distribution-bento">
          <div className="flex items-center gap-2xs pb-xs border-b border-border/40">
            <ShieldAlert className="w-5 h-5 text-error" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Severity Distribution</h4>
          </div>

          <div className="space-y-sm">
            {Object.entries(summary.counts).map(([sev, count]) => {
              const total = summary.total || 1;
              const ratio = Math.min(100, (count / total) * 100);
              
              let barColor = "bg-primary";
              let textColor = "text-text-primary";
              if (sev === Severity.CRITICAL) {
                barColor = "bg-error";
                textColor = "text-error font-bold";
              } else if (sev === Severity.WARNING) {
                barColor = "bg-warning";
                textColor = "text-warning font-bold";
              } else if (sev === Severity.INFORMATIONAL) {
                barColor = "bg-success";
                textColor = "text-success";
              }

              return (
                <div key={sev} className="space-y-1xs">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className={`uppercase font-bold ${textColor}`}>{sev}</span>
                    <span>{count} / {summary.total}</span>
                  </div>
                  <div className="w-full bg-background border h-xs rounded-full overflow-hidden">
                    <div 
                      className={`${barColor} h-full transition-all duration-300`} 
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-xs bg-background/50 border rounded-xs text-[10px] text-text-secondary leading-normal">
            <strong>Incident Severity Protocol:</strong> Critical incidents trigger automated AI prompt injections to construct tactical advice feeds within 2 seconds.
          </div>
        </div>

        {/* Live Incident Log & Timeline (2/3 Width) */}
        <div className="lg:col-span-2 border p-md bg-surface rounded-md space-y-sm text-left" id="incident-log-timeline-panel">
          <div className="flex items-center justify-between pb-xs border-b border-border/40">
            <div className="flex items-center gap-xs">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-display font-semibold text-caption text-text-primary">Active Incident Registry Timeline</h4>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1xs">
              {(["ALL", "OPEN", "RESOLVED"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-sm py-[2px] rounded-xs font-mono text-[9px] font-bold border cursor-pointer ${
                    filter === opt
                      ? "bg-primary text-primary-fg border-primary"
                      : "bg-background text-text-secondary border-border hover:bg-surface-hover"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs" id="incidents-scrolling-container">
            {displayedIncidents.length === 0 ? (
              <div className="text-center py-xl font-mono text-caption text-text-muted border border-dashed rounded-sm">
                No incidents match the selected filter.
              </div>
            ) : (
              displayedIncidents.map((inc) => {
                const isCritical = inc.severity === Severity.CRITICAL;
                const isWarning = inc.severity === Severity.WARNING;
                const borderClass = inc.status === IncidentStatus.RESOLVED
                  ? "border-success/35 bg-success/5"
                  : isCritical
                  ? "border-error/40 bg-error/5"
                  : isWarning
                  ? "border-warning/35 bg-warning/5"
                  : "border-border bg-background/40";

                return (
                  <div key={inc.id} className={`p-sm border rounded-sm flex justify-between items-start gap-md ${borderClass} gap-sm`}>
                    <div className="space-y-xs min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-xs flex-wrap">
                        <span className="font-mono font-bold text-[10px] text-text-primary shrink-0">{inc.id}</span>
                        <Badge 
                          variant={
                            inc.severity === Severity.CRITICAL 
                              ? "critical" 
                              : inc.severity === Severity.WARNING 
                              ? "warning" 
                              : "info"
                          } 
                          size="sm"
                          className="whitespace-nowrap shrink-0"
                        >
                          {inc.severity}
                        </Badge>
                        <span className="text-text-muted text-[10px] font-mono shrink-0">|</span>
                        <span className="font-mono text-[10px] text-text-secondary truncate">{inc.location.sector} - Section {inc.location.section}</span>
                      </div>

                      <p className="font-sans font-medium text-caption text-text-primary">{inc.description}</p>
                      
                      {inc.assignedStaff && inc.assignedStaff.length > 0 && (
                        <div className="text-[10px] font-mono text-text-secondary">
                          Assigned Units: <span className="text-primary font-bold">{inc.assignedStaff.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-xs shrink-0">
                      <IncidentSLATimer 
                        createdAt={inc.createdAt} 
                        severity={inc.severity} 
                        status={inc.status} 
                        simTime={simulationEngineState?.simulationTime || ""} 
                      />
                      <span className="text-[9px] font-mono text-text-muted">Status: {inc.status}</span>
                      
                      {(() => {
                        const isLocked = collab ? collab.isRecordLocked(inc.id) : false;
                        const activeLock = collab ? collab.locks.find(l => l.recordId === inc.id && Date.now() < l.expiresAt) : null;

                        if (isLocked) {
                          return (
                            <div className="space-y-xs text-right">
                              <span className="text-error font-mono text-[9px] font-bold flex items-center gap-[2px] justify-end animate-pulse-gentle">
                                <Lock className="w-3 h-3 text-error" />
                                LEASED BY {activeLock?.lockedByName.toUpperCase() || "OPERATOR"}
                              </span>
                              <button
                                disabled
                                className="px-sm py-xs bg-disabled-bg text-disabled-text border border-border font-mono text-[9px] font-bold rounded-xs cursor-not-allowed opacity-60"
                                title={`This incident is leased to ${activeLock?.lockedByName || "another operator"}. Editing is restricted.`}
                              >
                                Resolve Locked
                              </button>
                            </div>
                          );
                        }

                        if (inc.status !== IncidentStatus.RESOLVED) {
                          return (
                            <button
                              onClick={() => handleResolve(inc.id)}
                              className="px-sm py-xs bg-success text-success-fg hover:bg-success/90 font-mono text-[9px] font-bold rounded-xs cursor-pointer transition-all"
                            >
                              Resolve Log
                            </button>
                          );
                        }

                        return (
                          <span className="text-success font-mono font-bold text-[10px] flex items-center gap-1xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            RESOLVED
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
