/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  ShieldAlert, 
  Users, 
  Clock, 
  AlertTriangle, 
  Activity, 
  HeartPulse, 
  CheckCircle2, 
  Info 
} from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { HumanDecisionWorkflowManager } from "../../services/workflow/HumanDecisionWorkflow";
import { WorkflowStatus } from "../../services/workflow/types";
import { DecisionState, Severity, IncidentStatus } from "../../types";

export const ExecutiveOverviewWidget: React.FC = () => {
  const {
    incidents,
    gates,
    matches,
    weather,
    recommendations,
    simulationEngineState,
    isLoading
  } = useTournament();

  const workflowManager = HumanDecisionWorkflowManager.getInstance();
  const queue = workflowManager.getQueue({});
  const workflowMetrics = workflowManager.getMetrics();

  // Memoize live status metrics
  const stats = React.useMemo(() => {
    // 1. Overall Risk Evaluation
    const activeCriticalIncidents = incidents.filter(
      (i) => i.status !== IncidentStatus.RESOLVED && i.severity === Severity.CRITICAL
    ).length;
    const activeHighIncidents = incidents.filter(
      (i) => i.status !== IncidentStatus.RESOLVED && i.severity === Severity.WARNING
    ).length;
    const heavyCongestionGates = gates.filter((g) => g.waitTimeMinutes >= 15).length;

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let riskColor = "text-success border-success/30 bg-success/5";
    if (activeCriticalIncidents > 0 || (weather && weather.temperature >= 38)) {
      riskLevel = "CRITICAL";
      riskColor = "text-error border-error/40 bg-error/5 animate-pulse-gentle";
    } else if (activeHighIncidents > 0 || heavyCongestionGates > 0) {
      riskLevel = "HIGH";
      riskColor = "text-warning border-warning/40 bg-warning/5";
    } else if (incidents.filter((i) => i.status !== IncidentStatus.RESOLVED).length > 0) {
      riskLevel = "MEDIUM";
      riskColor = "text-accent border-accent/30 bg-accent/5";
    }

    // 2. Active Counts
    const activeIncidentsCount = incidents.filter((i) => i.status !== IncidentStatus.RESOLVED).length;
    const pendingRecommendationsCount = recommendations.filter((r) => r.status === DecisionState.PENDING).length;
    const pendingHumanDecisionsCount = queue.filter(
      (d) => d.status === WorkflowStatus.PENDING_REVIEW || d.status === WorkflowStatus.ASSIGNED_REVIEWER
    ).length;

    // 3. Simulated Live Attendance (Derived from gates through-flow + zone density)
    const baseGateEntranceSum = gates.reduce((sum, g) => sum + g.queueLength * 12 + 1500, 0);
    const totalAttendance = Math.min(80000, 35000 + baseGateEntranceSum + (simulationEngineState.tickCount * 45));

    // 4. Overall Crowd Health Status
    const avgWaitTime = gates.length > 0 ? gates.reduce((sum, g) => sum + g.waitTimeMinutes, 0) / gates.length : 0;
    let crowdHealth: "EXCELLENT" | "GOOD" | "STRESSED" | "CRITICAL" = "EXCELLENT";
    let crowdHealthColor = "text-success bg-success/10";
    if (avgWaitTime >= 15 || activeCriticalIncidents > 0) {
      crowdHealth = "CRITICAL";
      crowdHealthColor = "text-error bg-error/10";
    } else if (avgWaitTime >= 9 || activeHighIncidents > 0) {
      crowdHealth = "STRESSED";
      crowdHealthColor = "text-warning bg-warning/10";
    } else if (avgWaitTime >= 5) {
      crowdHealth = "GOOD";
      crowdHealthColor = "text-primary bg-primary/10";
    }

    return {
      riskLevel,
      riskColor,
      activeIncidentsCount,
      pendingRecommendationsCount,
      pendingHumanDecisionsCount,
      totalAttendance,
      avgWaitTime,
      crowdHealth,
      crowdHealthColor
    };
  }, [incidents, gates, weather, recommendations, queue, simulationEngineState.tickCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-xl min-h-32 border border-dashed rounded-md font-mono text-text-muted text-caption animate-pulse">
        Polling central telemetry...
      </div>
    );
  }

  const liveMatch = matches[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md" id="executive-overview-hud">
      
      {/* Risk Assessment Card */}
      <div 
        className={`p-md border rounded-md flex flex-col justify-between space-y-sm ${stats.riskColor}`}
        id="exec-card-risk"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Risk Level Assessment</span>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-display-sm font-display font-bold tracking-tight leading-none uppercase">
            {stats.riskLevel}
          </h4>
          <p className="text-[10px] opacity-80 mt-xs leading-normal font-sans">
            Evaluated continuously against active incidents & stadium ingress wait rates.
          </p>
        </div>
      </div>

      {/* Crowd Health & Attendance */}
      <div className="bg-surface border p-md rounded-md flex flex-col justify-between space-y-sm shadow-low" id="exec-card-crowd">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-wider">Crowd & Ingress Status</span>
          <Users className="w-5 h-5 text-text-muted" />
        </div>
        <div>
          <div className="flex items-baseline gap-xs">
            <span className="text-h1 font-display font-bold text-text-primary">
              {stats.totalAttendance.toLocaleString()}
            </span>
            <span className="text-text-muted font-mono text-[10px]">IN VENUE</span>
          </div>
          <div className="flex items-center gap-xs mt-2xs flex-wrap">
            <span className={`px-xs py-1xs font-mono text-[9px] font-bold rounded-xs shrink-0 whitespace-nowrap ${stats.crowdHealthColor}`}>
              HEALTH: {stats.crowdHealth}
            </span>
            <span className="text-[10px] text-text-secondary font-mono whitespace-nowrap">
              Avg wait: {stats.avgWaitTime.toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      {/* Decision Pipeline Stats */}
      <div className="bg-surface border p-md rounded-md flex flex-col justify-between space-y-sm shadow-low" id="exec-card-pipeline">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-wider">AI Operations Feed</span>
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="grid grid-cols-2 gap-xs">
            <div className="bg-background/80 p-xs border rounded-sm text-center">
              <span className="block font-mono text-caption text-text-muted uppercase">COPILOT</span>
              <span className="text-h3 font-display font-bold text-primary">{stats.pendingRecommendationsCount}</span>
            </div>
            <div className="bg-background/80 p-xs border rounded-sm text-center">
              <span className="block font-mono text-caption text-text-muted uppercase">PND APPROV</span>
              <span className="text-h3 font-display font-bold text-warning">{stats.pendingHumanDecisionsCount}</span>
            </div>
          </div>
          <p className="text-[9px] text-text-muted font-mono text-center mt-xs">
            Decision Success Rate: <strong className="text-text-primary">{(workflowMetrics.executionSuccessRate * 100).toFixed(0)}%</strong>
          </p>
        </div>
      </div>

      {/* Live Match Summary & System Health */}
      <div className="bg-surface border p-md rounded-md flex flex-col justify-between space-y-sm shadow-low" id="exec-card-match">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-wider">Fixture Summary</span>
          <Clock className="w-5 h-5 text-secondary" />
        </div>
        <div>
          {liveMatch ? (
            <div className="space-y-xs">
              <div className="flex items-center justify-between font-display font-bold text-caption text-text-primary">
                <span>France ({liveMatch.scoreHome})</span>
                <span className="text-text-muted">:</span>
                <span>Argentina ({liveMatch.scoreAway})</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary gap-xs flex-wrap">
                <span>Min: {liveMatch.currentMinute}'</span>
                <span className="flex items-center gap-1xs text-success font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                  LIVE
                </span>
              </div>
            </div>
          ) : (
            <span className="text-text-muted font-mono text-caption block">No fixture active.</span>
          )}
          <div className="border-t border-border/40 pt-xs mt-2xs flex justify-between items-center text-[9px] font-mono text-text-muted">
            <span>SYS HEARTBEAT:</span>
            <span className="text-success font-bold flex items-center gap-2xs">
              <CheckCircle2 className="w-3 h-3 text-success" />
              ONLINE
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
