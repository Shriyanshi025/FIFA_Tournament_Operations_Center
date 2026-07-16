/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { CloudSun, CloudRain, Thermometer, Compass, ShieldAlert, Clock } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { Badge } from "../ui/Badge";

export const WeatherWidget: React.FC = () => {
  const { weather, isLoading } = useTournament();

  if (isLoading || !weather) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Connecting to weather radar grid...
      </div>
    );
  }

  const isRainy = weather.condition.toLowerCase().includes("rain");
  const isHot = weather.temperature >= 35;

  let thermalImpact: "NOMINAL" | "HIGH HEAT" | "PRECIPITATION WET" = "NOMINAL";
  let alertColor = "border-success/20 bg-success/5 text-success";
  if (isHot) {
    thermalImpact = "HIGH HEAT";
    alertColor = "border-error/30 bg-error/5 text-error animate-pulse-gentle";
  } else if (isRainy) {
    thermalImpact = "PRECIPITATION WET";
    alertColor = "border-warning/30 bg-warning/5 text-warning";
  }

  return (
    <div className="space-y-lg" id="weather-operations-dashboard">
      
      {/* Primary Weather Indicators Layout */}
      <div className="grid grid-cols-1 gap-sm">
        
        {/* Core Celsius and Condition Card */}
        <div className="border bg-surface p-md rounded-md flex items-center justify-between shadow-low" id="weather-card-reading">
          <div className="space-y-2xs text-left">
            <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Current Temperature</span>
            <div className="flex items-baseline gap-xs">
              <span className="text-display-md font-display font-bold text-text-primary">
                {weather.temperature}
              </span>
              <span className="text-text-secondary text-h1 font-light">°C</span>
            </div>
            <span className="font-mono text-[10px] text-text-secondary block font-semibold uppercase">
              Condition: {weather.condition}
            </span>
          </div>

          <div className="p-sm bg-primary/10 rounded-full shrink-0">
            {isRainy ? (
              <CloudRain className="w-10 h-10 text-primary" />
            ) : (
              <CloudSun className="w-10 h-10 text-warning" />
            )}
          </div>
        </div>

        {/* Environmental Physics Meters */}
        <div className="border bg-surface p-md rounded-md space-y-md shadow-low text-left" id="weather-card-physics">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Compass className="w-5 h-5 text-secondary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Atmospheric Physics</h4>
          </div>

          <div className="grid grid-cols-2 gap-sm text-[11px] font-mono">
            <div>
              <span className="text-text-muted text-[8px] block uppercase">Humidity</span>
              <strong className="text-text-primary text-h3">{weather.humidity}%</strong>
            </div>
            <div>
              <span className="text-text-muted text-[8px] block uppercase">Wind Speed</span>
              <strong className="text-text-primary text-h3">{weather.windSpeed} km/h</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Operational Impact Index */}
        <div className="border bg-surface p-md rounded-md flex flex-col justify-between space-y-2xs shadow-low text-left" id="weather-card-impact">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-text-muted uppercase font-bold block">Operational Thermal Impact</span>
            <Thermometer className="w-5 h-5 text-accent" />
          </div>

          <div>
            <span className={`inline-block px-xs py-[2px] rounded-xs font-mono text-[10px] font-bold border ${alertColor} whitespace-nowrap`}>
              IMPACT: {thermalImpact}
            </span>
            <p className="text-[10px] text-text-secondary mt-xs leading-normal">
              Directly influences pedestrian queue stamina indices and spectator hydration levels.
            </p>
          </div>
        </div>

      </div>

      {/* Advisory Dispatch Block */}
      {weather.advisory && (
        <div className="p-md border border-dashed rounded-md bg-background/50 text-left space-y-xs" id="weather-advisory-panel">
          <div className="flex items-center gap-2xs">
            <ShieldAlert className="w-5 h-5 text-warning" />
            <span className="font-mono text-[10px] font-bold text-text-primary uppercase">TOC Weather Advisory Dispatch</span>
          </div>
          <p className="font-sans font-medium text-caption text-text-secondary leading-relaxed">
            {weather.advisory}
          </p>
          <div className="text-[9px] font-mono text-text-muted">
            LAST UPDATED: {new Date(weather.lastUpdatedAt).toLocaleTimeString()} • SYSTEM SOURCE: METEOSAT RADAR
          </div>
        </div>
      )}

    </div>
  );
};
