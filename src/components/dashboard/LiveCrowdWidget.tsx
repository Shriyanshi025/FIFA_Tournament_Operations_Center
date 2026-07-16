/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { Gauge, Users, Activity, TrendingUp, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { Badge } from "../ui/Badge";

export const LiveCrowdWidget: React.FC = () => {
  const { gates, crowdZones, isLoading } = useTournament();

  // Memoize sector congestion ratios
  const sectorData = React.useMemo(() => {
    const sectors = ["North Sector", "South Sector", "East Sector", "West Sector"];
    return sectors.map((sec) => {
      // Find crowd zones in this sector
      const zonesInSec = crowdZones.filter((cz) => cz.name.includes(sec.split(" ")[0]));
      const totalCount = zonesInSec.reduce((sum, z) => sum + z.estimatedHeadcount, 0);
      const avgDensity = zonesInSec.reduce((sum, z) => sum + z.densityPercentage, 0) / (zonesInSec.length || 1);
      const densityRatio = avgDensity / 100;

      let densityLevel: "NOMINAL" | "MODERATE" | "CONGESTED" | "CRITICAL" = "NOMINAL";
      let badgeColor = "bg-success/10 text-success border-success/20";
      if (densityRatio >= 0.85) {
        densityLevel = "CRITICAL";
        badgeColor = "bg-error/10 text-error border-error/30 animate-pulse-gentle";
      } else if (densityRatio >= 0.65) {
        densityLevel = "CONGESTED";
        badgeColor = "bg-warning/10 text-warning border-warning/30";
      } else if (densityRatio >= 0.4) {
        densityLevel = "MODERATE";
        badgeColor = "bg-primary/10 text-primary border-primary/20";
      }

      return {
        sector: sec,
        count: totalCount || Math.floor(Math.random() * 2000) + 3000,
        densityText: `${avgDensity.toFixed(0)}% density`,
        ratio: densityRatio || 0.45,
        level: densityLevel,
        badgeColor
      };
    });
  }, [crowdZones]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Calculating current gate flow density...
      </div>
    );
  }

  const totalInFlow = gates.reduce((sum, g) => sum + (g.status === "OPEN" ? g.currentFlowRate : 0), 0);
  const totalQueue = gates.reduce((sum, g) => sum + g.queueLength, 0);

  return (
    <div className="space-y-lg" id="live-crowd-operations-dashboard">
      
      {/* Crowd Flow Header Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md" id="crowd-flow-scoreboard-bar">
        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Combined Gate Ingress Rate</span>
          <div className="flex items-baseline gap-2xs mt-1xs">
            <span className="text-h2 font-display font-bold text-text-primary">{totalInFlow}</span>
            <span className="text-text-secondary font-mono text-[10px]">pax / min</span>
          </div>
          <p className="text-[9px] text-text-muted mt-1xs font-mono">Live turnstile passage throughput.</p>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Queue Accumulation</span>
          <div className="flex items-baseline gap-2xs mt-1xs">
            <span className="text-h2 font-display font-bold text-warning">{totalQueue}</span>
            <span className="text-text-secondary font-mono text-[10px]">pax waiting</span>
          </div>
          <p className="text-[9px] text-text-muted mt-1xs font-mono">Sum of queue length across gates.</p>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Egress Discharge Rate</span>
          <div className="flex items-baseline gap-2xs mt-1xs">
            <span className="text-h2 font-display font-bold text-text-muted">0</span>
            <span className="text-text-secondary font-mono text-[10px]">pax / min</span>
          </div>
          <p className="text-[9px] text-text-muted mt-1xs font-mono">Pre-egress phase is currently active.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        
        {/* Gate Workloads Breakdown */}
        <div className="space-y-md border border-border bg-surface p-md rounded-md" id="gate-workloads-panel">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Gauge className="w-5 h-5 text-primary" />
            <h4 className="font-display font-semibold text-body-base text-text-primary">Gate Processing Loads</h4>
          </div>

          <div className="space-y-sm">
            {gates.map((g) => {
              const loadPercent = Math.min(100, (g.waitTimeMinutes / 20) * 100);
              const isHigh = g.waitTimeMinutes >= 15;
              const isMed = g.waitTimeMinutes >= 8 && g.waitTimeMinutes < 15;
              const colorClass = isHigh ? "bg-error" : isMed ? "bg-warning" : "bg-success";

              return (
                <div key={g.id} className="p-xs bg-background/30 border rounded-sm space-y-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-text-primary">{g.name}</span>
                    <span className="font-mono text-[10px] text-text-secondary">
                      Wait: <strong className={isHigh ? "text-error" : isMed ? "text-warning" : "text-success"}>{g.waitTimeMinutes}m</strong>
                    </span>
                  </div>

                  {/* Wait Time Gauge */}
                  <div className="w-full bg-background border h-xs rounded-full overflow-hidden">
                    <div 
                      className={`${colorClass} h-full transition-all duration-500`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap justify-between items-center text-[10px] font-mono text-text-muted pt-1xs gap-xs">
                    <div className="flex gap-xs flex-wrap">
                      <span>Flux: <strong className="text-text-secondary">{g.currentFlowRate}/m</strong></span>
                      <span>•</span>
                      <span>Queued: <strong className="text-text-secondary">{g.queueLength} pax</strong></span>
                    </div>
                    <Badge variant={g.status === "OPEN" ? "success" : "neutral"} size="sm" className="shrink-0 whitespace-nowrap">
                      {g.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Density Heatmap Indicators */}
        <div className="space-y-md border border-border bg-surface p-md rounded-md" id="sector-heatmap-panel">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Users className="w-5 h-5 text-secondary" />
            <h4 className="font-display font-semibold text-body-base text-text-primary">Stadium Sector Heat Indicators</h4>
          </div>

          <div className="space-y-xs">
            {sectorData.map((sec) => (
              <div key={sec.sector} className="flex items-center justify-between p-sm bg-background/50 border rounded-sm gap-sm">
                <div className="space-y-1xs text-left min-w-0 flex-1">
                  <span className="font-display font-semibold text-caption text-text-primary block truncate">{sec.sector}</span>
                  <div className="font-mono text-[10px] text-text-secondary truncate">
                    Headcount: {sec.count.toLocaleString()} ({sec.densityText})
                  </div>
                </div>

                <div className="flex items-center gap-sm shrink-0">
                  {/* Miniature CSS Horizontal Bar Gauge */}
                  <div className="w-24 bg-background border h-[6px] rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className={`h-full ${
                        sec.level === "CRITICAL" ? "bg-error" : sec.level === "CONGESTED" ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${sec.ratio * 100}%` }}
                    />
                  </div>
                  <span className={`px-xs py-[2px] rounded-xs font-mono text-[9px] font-bold border ${sec.badgeColor} whitespace-nowrap shrink-0`}>
                    {sec.level}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-sm bg-background border border-dashed rounded-sm flex items-start gap-xs text-[10px] text-text-secondary leading-normal text-left">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
            <p>
              In extreme congestion events, the Event Bus raises warnings to prompt the Recommendation Engine to generate turnstile redirection actions.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
