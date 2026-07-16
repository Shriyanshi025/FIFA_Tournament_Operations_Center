/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { Train, Compass, ShieldAlert, ArrowRightLeft, Clock } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { Badge } from "../ui/Badge";

export const TransportationWidget: React.FC = () => {
  const { transportLines, isLoading } = useTournament();

  const metrics = React.useMemo(() => {
    const totalLines = transportLines.length;
    const delayedLines = transportLines.filter((t) => t.status === "DELAYED").length;
    const suspendedLines = transportLines.filter((t) => t.status === "SUSPENDED").length;

    // Simulated Parking & Pedestrian Flow numbers reacting to time-ticks
    const parkingLots = [
      { id: "LOT-A", name: "North VIP Deck", occupancy: 88, capacity: 500 },
      { id: "LOT-B", name: "East Spectator Lot", occupancy: 94, capacity: 2500 },
      { id: "LOT-C", name: "South Transit Hub Parking", occupancy: 76, capacity: 1200 }
    ];

    const pedestrianZones = [
      { name: "Metro Concourse Walkway", velocity: "Fast Walk", load: "HIGH" },
      { name: "Shuttle Terminal Gate D Plaza", velocity: "Slow Congested", load: "PEAK" },
      { name: "West Pedestrian Boulevard", velocity: "Free Flow", load: "LOW" }
    ];

    return { totalLines, delayedLines, suspendedLines, parkingLots, pedestrianZones };
  }, [transportLines]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Retrieving transit schedule telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-lg" id="transportation-operations-dashboard">
      
      {/* Overview Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm" id="transportation-kpis">
        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Active Transport Lines</span>
          <span className="text-h2 font-display font-bold text-text-primary mt-1xs block">{metrics.totalLines}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Delayed Systems</span>
          <span className="text-h2 font-display font-bold text-warning mt-1xs block">{metrics.delayedLines}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">Suspended Operations</span>
          <span className="text-h2 font-display font-bold text-error mt-1xs block">{metrics.suspendedLines}</span>
        </div>

        <div className="bg-background/40 border p-sm rounded-sm text-center">
          <span className="font-mono text-[9px] text-text-muted uppercase block font-semibold">System Capacity Load</span>
          <span className="text-h2 font-display font-bold text-success mt-1xs block">86%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Transit Lines Board (2/3 Width) */}
        <div className="lg:col-span-2 border p-md bg-surface rounded-md space-y-md text-left" id="transit-lines-board">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Train className="w-5 h-5 text-primary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Metropolitan & shuttle line boards</h4>
          </div>

          <div className="space-y-xs max-h-[300px] overflow-y-auto pr-xs">
            {transportLines.map((line) => {
              const isNominal = line.status === "NOMINAL";
              const isSuspended = line.status === "SUSPENDED";
              const badgeVariant = isNominal ? "success" : isSuspended ? "critical" : "warning";

              const loadColors = line.passengerLoad === "PEAK"
                ? "bg-error/15 text-error border-error/30"
                : line.passengerLoad === "HIGH"
                ? "bg-warning/15 text-warning border-warning/20"
                : "bg-success/15 text-success border-success/20";

              return (
                <div key={line.id} className="p-sm bg-background/50 border rounded-sm flex items-center justify-between text-[11px] font-mono gap-sm">
                  <div className="space-y-1xs text-left min-w-0 flex-1">
                    <div className="flex items-center gap-xs flex-wrap">
                      <span className="font-bold text-text-primary text-[11px] truncate">{line.name}</span>
                      <span className="text-[9px] text-text-muted shrink-0">({line.type})</span>
                    </div>
                    {line.currentAdvisory && (
                      <span className="block text-[10px] text-text-secondary italic truncate">Advisory: {line.currentAdvisory}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-xs sm:gap-sm shrink-0 flex-wrap justify-end">
                    <div className="text-right hidden xs:block">
                      <span className="text-text-muted text-[8px] block uppercase leading-none">Headway</span>
                      <strong className="text-text-primary text-[10px]">{line.headwayMinutes}m</strong>
                    </div>

                    <span className={`px-xs py-[2px] rounded-xs text-[9px] font-bold border ${loadColors} whitespace-nowrap shrink-0`}>
                      LOAD: {line.passengerLoad}
                    </span>

                    <Badge variant={badgeVariant} size="sm" className="whitespace-nowrap shrink-0">
                      {line.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parking Lot Status & Pedestrians (1/3 Width) */}
        <div className="border p-md bg-surface rounded-md space-y-md text-left" id="parking-pedestrian-panel">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Compass className="w-5 h-5 text-secondary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Parking & Pedestrian Flows</h4>
          </div>

          {/* Parking Loads */}
          <div className="space-y-xs">
            <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Smart Parking Hub Lots</span>
            {metrics.parkingLots.map((lot) => {
              const ratio = Math.min(100, (lot.occupancy / 100) * 100);
              const barColor = ratio >= 90 ? "bg-error" : ratio >= 75 ? "bg-warning" : "bg-success";

              return (
                <div key={lot.id} className="p-xs bg-background/40 border rounded-sm space-y-1xs">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold text-text-primary">{lot.name}</span>
                    <span>{lot.occupancy}%</span>
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

          {/* Pedestrian Flow Density */}
          <div className="space-y-xs pt-sm border-t border-border/40">
            <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Pedestrian Boulevard Flows</span>
            {metrics.pedestrianZones.map((ped) => (
              <div key={ped.name} className="p-xs bg-background/50 border rounded-sm flex items-center justify-between text-[11px] font-mono gap-sm">
                <span className="font-semibold text-text-primary text-left truncate min-w-0 flex-1">{ped.name}</span>
                <div className="flex items-center gap-xs shrink-0">
                  <span className="text-text-muted text-[9px] shrink-0">{ped.velocity}</span>
                  <Badge variant={ped.load === "PEAK" ? "critical" : ped.load === "HIGH" ? "warning" : "success"} size="sm" className="shrink-0 whitespace-nowrap">
                    {ped.load}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
