import * as React from "react";
import { Globe, Settings2 } from "lucide-react";
import { useShell } from "./ShellProvider";
import { useTournament } from "../context/TournamentContext";
import { Card, Input } from "../components";

export function RightSidebar() {
  const { preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch } = useShell();
  const { incidents, matches, weather } = useTournament();

  return (
    <div className="space-y-lg text-left" id="sidebar-telemetries">
      {/* Module 1: Live Tournament Operations Summary */}
      <div>
        <div className="flex items-center gap-xs mb-sm">
          <Globe className="w-md h-md text-primary animate-pulse-gentle" aria-hidden="true" />
          <h4 className="font-display font-bold text-body-base text-text-primary">Live Venue Context</h4>
        </div>
        <Card shadow="none" className="bg-background/40 p-sm border border-border space-y-xs">
          <div className="flex justify-between font-mono text-caption text-text-secondary">
            <span>Operational State:</span>
            <span className={`font-bold ${incidents.some(i => i.severity === "CRITICAL" && i.status !== "RESOLVED") ? "text-error" : "text-success"}`}>
              {incidents.some(i => i.severity === "CRITICAL" && i.status !== "RESOLVED") ? "ATTENTION" : "NOMINAL"}
            </span>
          </div>
          <div className="flex justify-between font-mono text-caption text-text-secondary">
            <span>Stadium Attendance:</span>
            <span className="text-primary font-bold">
              {matches[0]?.attendance ? matches[0].attendance.toLocaleString() : "---"}
            </span>
          </div>
          <div className="flex justify-between font-mono text-caption text-text-secondary">
            <span>Critical Incidents:</span>
            <span className="text-warning font-bold">
              {incidents.filter(i => i.status !== "RESOLVED").length} Open
            </span>
          </div>
          <div className="flex justify-between font-mono text-caption text-text-secondary">
            <span>Weather Advisory:</span>
            <span className="text-text-primary font-bold">
              {weather ? `${weather.temperature}°C ${weather.condition}` : "---"}
            </span>
          </div>
        </Card>
      </div>

      <hr className="border-border/50" />

      {/* Module 2: Display Options */}
      <div>
        <div className="flex items-center gap-xs mb-sm">
          <Settings2 className="w-md h-md text-secondary" aria-hidden="true" />
          <h4 className="font-display font-bold text-body-base text-text-primary">Display Preferences</h4>
        </div>
        <div className="space-y-sm" id="sidebar-checks">
          <label className="flex items-center gap-sm text-caption text-text-secondary cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={preferences.denseMode}
              onChange={(e) => setPreferences((prev) => ({ ...prev, denseMode: e.target.checked }))}
              className="rounded-xs border-border bg-background text-primary focus:ring-focus w-md h-md cursor-pointer"
            />
            <span>High Density Data View</span>
          </label>

          <label className="flex items-center gap-sm text-caption text-text-secondary cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={preferences.showSystemHealth}
              onChange={(e) => setPreferences((prev) => ({ ...prev, showSystemHealth: e.target.checked }))}
              className="rounded-xs border-border bg-background text-primary focus:ring-focus w-md h-md cursor-pointer"
            />
            <span>Show Stadium Health HUD</span>
          </label>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Module 3: Active Scope Selections */}
      <div>
        <h4 className="font-display font-bold text-caption text-text-primary mb-sm">Active Tournament Scope</h4>
        <div className="space-y-sm" id="venue-selection-inputs">
          <Input 
            label="Target Stadium Venue" 
            value={currentVenue}
            onChange={(e) => setCurrentVenue(e.target.value)}
            className="text-xs"
          />
          <Input 
            label="Active Match Pairing" 
            value={currentMatch}
            onChange={(e) => setCurrentMatch(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}
