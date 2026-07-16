/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { Sliders, CheckCircle2, ShieldCheck, Flame, Compass } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";

export const SustainabilityWidget: React.FC = () => {
  const { simulationEngineState, isLoading, gates } = useTournament();

  const metrics = React.useMemo(() => {
    // Calculate simulated sustainability telemetry reacting to time dilation and attendance
    const tick = simulationEngineState.tickCount || 12;
    const gateSum = gates.reduce((sum, g) => sum + g.queueLength, 0);
    const activePax = 45000 + gateSum * 15;

    // 1. Water Usage: roughly 0.15 liters per min per active fan in the stadium
    const waterLitersMin = activePax * 0.15;
    const totalWaterKiloLiters = 120 + (tick * 2.4);

    // 2. Energy Load: stadium pitch lights, HVAC, catering, and scoreboards
    const baseloadKw = 4200; // Base lighting and HVAC load
    const activeLoadKw = baseloadKw + (gateSum * 12) + (tick * 25);

    // 3. Waste collected in metric tons
    const wasteTons = 4.2 + (tick * 0.18);

    // 4. Carbon Footprint Estimate in kg CO2 equivalent
    const carbonKg = activeLoadKw * 0.45;

    return { waterLitersMin, totalWaterKiloLiters, activeLoadKw, wasteTons, carbonKg };
  }, [simulationEngineState.tickCount, gates]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Polling environmental meters...
      </div>
    );
  }

  return (
    <div className="space-y-lg" id="sustainability-operations-dashboard">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        
        {/* Energy Load Card */}
        <div className="border bg-surface p-md rounded-md space-y-sm shadow-low text-left" id="sustain-energy-card">
          <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Power Grid Energy Load</span>
          <div>
            <div className="flex items-baseline gap-xs">
              <span className="text-display-sm font-display font-bold text-text-primary">
                {metrics.activeLoadKw.toFixed(0)}
              </span>
              <span className="text-text-secondary font-mono text-caption font-semibold">kW</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2xs leading-normal font-mono">
              Stadium climate controls & lighting arrays.
            </p>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-background border h-[4px] rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, (metrics.activeLoadKw / 8000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Water Flow Card */}
        <div className="border bg-surface p-md rounded-md space-y-sm shadow-low text-left" id="sustain-water-card">
          <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Water Flow Intake</span>
          <div>
            <div className="flex items-baseline gap-xs">
              <span className="text-display-sm font-display font-bold text-text-primary">
                {metrics.waterLitersMin.toFixed(0)}
              </span>
              <span className="text-text-secondary font-mono text-caption font-semibold">L / min</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2xs leading-normal font-mono">
              Recycling loops active across rest structures.
            </p>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full overflow-hidden">
            <div 
              className="bg-secondary h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, (metrics.waterLitersMin / 15000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Waste Collection Card */}
        <div className="border bg-surface p-md rounded-md space-y-sm shadow-low text-left" id="sustain-waste-card">
          <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Waste Mass Collected</span>
          <div>
            <div className="flex items-baseline gap-xs">
              <span className="text-display-sm font-display font-bold text-text-primary">
                {metrics.wasteTons.toFixed(2)}
              </span>
              <span className="text-text-secondary font-mono text-caption font-semibold">M. Tons</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2xs leading-normal font-mono">
              94% sorted and redirected to recycle loops.
            </p>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full overflow-hidden">
            <div 
              className="bg-warning h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, (metrics.wasteTons / 10) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbon Footprint Card */}
        <div className="border bg-surface p-md rounded-md space-y-sm shadow-low text-left" id="sustain-carbon-card">
          <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">CO2 Equivalent Footprint</span>
          <div>
            <div className="flex items-baseline gap-xs">
              <span className="text-display-sm font-display font-bold text-text-primary">
                {metrics.carbonKg.toFixed(0)}
              </span>
              <span className="text-text-secondary font-mono text-caption font-semibold">kg CO2</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2xs leading-normal font-mono">
              Compensated dynamically via carbon purchase programs.
            </p>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, (metrics.carbonKg / 5000) * 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Sustainability Operations Certificate */}
      <div className="p-sm bg-background border border-dashed rounded-sm flex items-center justify-between text-[11px] font-mono text-left gap-sm flex-wrap" id="sustain-certification-banner">
        <div className="space-y-xs min-w-0 flex-1">
          <span className="font-bold text-text-primary block">FIFA GREEN VENUE OPERATION PROTOCOLS ACTIVE</span>
          <p className="text-[10px] text-text-secondary leading-normal">
            Our stadium HVAC systems dial down capacity by 15% during active game intervals to reduce thermal offsets automatically.
          </p>
        </div>
        <span className="text-success font-bold shrink-0 whitespace-nowrap">ISO-14001 COMPLIANT</span>
      </div>

    </div>
  );
};
