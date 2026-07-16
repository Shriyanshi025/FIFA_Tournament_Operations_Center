/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { UserCheck, Clock, Users, ShieldAlert, CheckCircle2 } from "lucide-react";
import { HumanDecisionWorkflowManager } from "../../services/workflow/HumanDecisionWorkflow";
import { useTournament } from "../../context/TournamentContext";
import { ReviewerRole } from "../../services/workflow/types";
import { Badge } from "../ui/Badge";

export const HumanWorkflowWidget: React.FC = () => {
  // Sync on tournament ticks/reloads
  const { recommendations, isLoading } = useTournament();
  
  const workflowManager = HumanDecisionWorkflowManager.getInstance();
  const queue = workflowManager.getQueue({});
  const metrics = workflowManager.getMetrics();

  const activeReviewersWorkload = React.useMemo(() => {
    return Object.entries(metrics.reviewerWorkload || {}).map(([role, val]) => ({
      role: role as ReviewerRole,
      count: val as number
    }));
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Retrieving active workflow statistics...
      </div>
    );
  }

  return (
    <div className="space-y-lg" id="human-workflow-operations-dashboard">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm" id="workflow-stats-grid">
        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Central Workflow Size</span>
          <span className="text-h2 font-display font-bold text-text-primary mt-1xs block">{queue.length}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Avg Review Latency</span>
          <span className="text-h2 font-display font-bold text-primary mt-1xs block">{metrics.averageReviewTimeMinutes.toFixed(1)}m</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Accountable Approval Rate</span>
          <span className="text-h2 font-display font-bold text-success mt-1xs block">{(metrics.approvalRate * 100).toFixed(0)}%</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Conflict Escalation Rate</span>
          <span className="text-h2 font-display font-bold text-error mt-1xs block">{(metrics.escalationRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Department Workload Breakdown */}
        <div className="border p-md bg-surface rounded-md space-y-md text-left" id="reviewer-workloads-panel">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Department Workload Backlogs</h4>
          </div>

          <div className="space-y-sm">
            {activeReviewersWorkload.map(({ role, count }) => {
              const maxVal = Math.max(...activeReviewersWorkload.map((w) => w.count)) || 1;
              const percent = Math.min(100, (count / maxVal) * 100);

              return (
                <div key={role} className="space-y-1xs">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="uppercase font-semibold text-text-primary">{role} Command</span>
                    <span className="font-bold text-text-secondary">{count} active</span>
                  </div>
                  <div className="w-full bg-background border h-xs rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Escaped Conflicts HUD (2/3 Width) */}
        <div className="lg:col-span-2 border p-md bg-surface rounded-md space-y-md text-left" id="active-conflicts-registry-panel">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <ShieldAlert className="w-5 h-5 text-warning animate-pulse-gentle" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Active Structural Conflicts & Priority Inversions</h4>
          </div>

          <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs" id="conflicts-scrolling-container">
            {queue.every((d) => d.conflicts.length === 0) ? (
              <div className="text-center py-xl font-mono text-caption text-text-muted border border-dashed rounded-sm flex flex-col items-center justify-center space-y-xs">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <span>Zero Priority Inversions or Overlapping Resource Contention Detected</span>
              </div>
            ) : (
              queue.flatMap((d) => d.conflicts).map((conf) => (
                <div key={conf.id} className="p-sm border border-warning/30 bg-warning/5 rounded-sm flex items-start gap-md justify-between gap-sm">
                  <div className="space-y-xs min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-xs flex-wrap">
                      <span className="font-mono font-bold text-[10px] text-text-primary shrink-0">{conf.id}</span>
                      <Badge variant="warning" size="sm" className="shrink-0 whitespace-nowrap">{conf.type}</Badge>
                      <span className="font-mono text-[10px] text-text-muted shrink-0">Severity: {conf.severity}</span>
                    </div>
                    <p className="font-sans font-medium text-[11px] text-text-primary leading-normal">{conf.description}</p>
                    <div className="text-[10px] font-mono text-text-secondary">
                      Suggested Action: <strong className="text-primary leading-normal">{conf.resolutionAction}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
