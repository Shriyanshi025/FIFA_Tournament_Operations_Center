import * as React from "react";
import { 
  Settings2, HelpCircle, Layout, Activity, AlertOctagon, Map, UserCheck, RefreshCw, Globe, Calendar, Users, TrendingUp, Train, Clock, HeartPulse, CloudSun, AlertTriangle, Play, Pause, RotateCcw, Gauge, CheckCircle2, XCircle, TrendingDown, ShieldAlert, Sliders, Send, Sparkles, MapPin, Flame, Thermometer, CloudRain, Compass
} from "lucide-react";
import { MatchStatus, DecisionState, ActionPriority } from "../types";
import { AIRequestManager, AIAuditLayer, PromptRegistry, AIAuditEntry } from "../services/aiRuntime";
import { useShell } from "../layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Alert, Input, Spinner } from "../components";
import { useTournament } from "../context/TournamentContext";
import { useCollaboration } from "../context/CollaborationContext";

import { ResourceWidget } from "../components/dashboard/ResourceWidget";


export function MapView() {
  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();

  const {
    incidents, gates, crowdZones, volunteers, medicalTeams, securityTeams, resources, accessibilityResources, matches, transportLines, weather, recommendations, selectedIncidentId, setSelectedIncidentId, selectedGateId, setSelectedGateId, selectedSector, setSelectedSector, searchQuery, setSearchQuery, isLoading, simulationActive, simulationScenario, availableScenarios, simulationEngineState, notifications, unreadNotificationCount, reloadAllState, createIncident, updateIncidentStatus, assignStaffToIncident, updateGateStatus, resolveRecommendation, publishNotification, markNotificationAsRead, markAllNotificationsRead, startScenario, stopScenario, setSimulationPaused, setSimulationSpeed, resetSimulation
  } = useTournament();

  const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  return (
    <Card shadow="medium" className="p-lg space-y-md border border-border bg-surface" id="map-view-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-border/40 pb-sm">
                <div className="flex items-center gap-xs">
                  <Map className="w-xl h-xl text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="font-display font-semibold text-h2 text-text-primary">Stadium Gate Layout & Sectors</h3>
                    <p className="text-text-secondary text-caption uppercase font-mono">Lusail Arena • Dynamic Congestion Overlay</p>
                  </div>
                </div>
                <div className="flex items-center gap-xs font-mono text-[10px] text-text-secondary bg-background border px-xs py-[2px] rounded-xs">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse-gentle"></span>
                  <span>Sensor Mesh Connected</span>
                </div>
              </div>

              {/* Graphical stadium map layout schema */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg" id="map-grid-container">
                
                {/* INTERACTIVE DIAGRAM (2/3 Width) */}
                <div className="lg:col-span-2 space-y-sm bg-background/50 border border-border p-md rounded-md flex flex-col items-center justify-center min-h-[350px]">
                  <span className="font-mono text-[10px] text-text-muted mb-sm">SPATIAL SECTOR MAP OVERLAY (CLICK GATES TO INSPECT)</span>
                  
                  {/* SVG Map representation */}
                  <svg viewBox="0 0 400 400" className="w-64 h-64 md:w-80 md:h-80" aria-label="Lusail Stadium Map">
                    {/* Outer Circle (Stadium Ring) */}
                    <circle cx="200" cy="200" r="150" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                    
                    {/* Inner pitch circle */}
                    <rect x="150" y="140" width="100" height="120" fill="var(--color-primary-light, #2563eb15)" stroke="var(--color-border)" strokeWidth="2" rx="4" />
                    <circle cx="200" cy="200" r="25" fill="none" stroke="var(--color-border)" strokeWidth="2" />

                    {/* Sector Lines and Text overlays */}
                    <line x1="200" y1="50" x2="200" y2="350" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50" y1="200" x2="350" y2="200" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Interactive Slices / Gate Markers */}
                    {gates.map((g, idx) => {
                      // Positions
                      let cx = 200;
                      let cy = 200;
                      if (g.id.includes("WEST")) { cx = 80; cy = 200; }
                      else if (g.id.includes("EAST")) { cx = 320; cy = 200; }
                      else if (g.id.includes("SOUTH")) { cx = 200; cy = 320; }
                      else if (g.id.includes("NORTH")) { cx = 200; cy = 80; }
                      else if (g.id.includes("HOSPITALITY")) { cx = 300; cy = 100; }

                      const isCritical = g.waitTimeMinutes >= 15;
                      const isMod = g.waitTimeMinutes >= 8 && g.waitTimeMinutes < 15;
                      const markerColor = isCritical ? "#ef4444" : isMod ? "#f59e0b" : "#10b981";

                      return (
                        <g 
                          key={g.id} 
                          className="cursor-pointer group" 
                          onClick={() => {
                            setSelectedGateId(g.id);
                            setSelectedSector(g.name.split(" ").pop() || "Southwest");
                          }}
                        >
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={selectedGateId === g.id ? "16" : "12"} 
                            fill={markerColor} 
                            opacity="0.8"
                            className="transition-all duration-300 group-hover:opacity-100" 
                          />
                          <text 
                            x={cx} 
                            y={cy + 4} 
                            textAnchor="middle" 
                            fill="#ffffff" 
                            fontSize="9" 
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {g.id.split("-")[1]?.charAt(0) || "G"}
                          </text>
                        </g>
                      );
                    })}

                    {/* Labels */}
                    <text x="200" y="30" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold" fontFamily="monospace">NORTH STAND</text>
                    <text x="200" y="380" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold" fontFamily="monospace">SOUTH STAND</text>
                    <text x="30" y="205" textAnchor="start" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold" fontFamily="monospace">WEST</text>
                    <text x="370" y="205" textAnchor="end" fill="var(--color-text-secondary)" fontSize="10" fontWeight="bold" fontFamily="monospace">EAST</text>
                  </svg>
                </div>

                {/* TELEMETRY SELECTOR (1/3 Width) */}
                <div className="space-y-sm text-left">
                  {selectedGateId ? (
                    gates.filter(g => g.id === selectedGateId).map((g) => (
                      <Card key={g.id} className="p-md border bg-background space-y-md">
                        <div className="flex items-center justify-between border-b pb-xs">
                          <span className="font-mono text-caption font-bold text-text-primary">{g.name}</span>
                          <button 
                            onClick={() => setSelectedGateId(null)}
                            className="font-mono text-[10px] text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            Clear Selection
                          </button>
                        </div>

                        <div className="space-y-sm">
                          <div className="flex justify-between text-caption font-mono">
                            <span className="text-text-secondary">Assigned Sector:</span>
                            <span className="font-bold text-text-primary">{g.name.split(" ").pop() || "Southwest"}</span>
                          </div>
                          <div className="flex justify-between text-caption font-mono">
                            <span className="text-text-secondary">Turnstile Status:</span>
                            <Badge variant={g.status === "OPEN" ? "success" : "neutral"} size="sm">{g.status}</Badge>
                          </div>
                          <div className="flex justify-between text-caption font-mono">
                            <span className="text-text-secondary">Queue Wait Time:</span>
                            <span className={`font-bold ${g.waitTimeMinutes >= 15 ? "text-error" : "text-success"}`}>{g.waitTimeMinutes} mins</span>
                          </div>
                          <div className="flex justify-between text-caption font-mono">
                            <span className="text-text-secondary">Current Flow Velocity:</span>
                            <span className="font-bold text-text-primary">{g.currentFlowRate} fans / minute</span>
                          </div>
                        </div>

                        {g.waitTimeMinutes >= 12 && (
                          <div className="p-xs bg-warning/5 border border-warning/30 rounded-xs text-[10px] text-warning space-y-xs">
                            <AlertTriangle className="w-4 h-4 text-warning inline mr-xs shrink-0" />
                            <strong>Active Rerouting Recommended:</strong>
                            <p>Spectator load is pushing gate scanners above nominal levels. We suggest opening auxiliary ticket scanning terminals in Southwest corridor.</p>
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="p-lg border border-dashed border-border rounded-md text-center flex flex-col items-center justify-center space-y-xs min-h-[200px]">
                      <Compass className="w-xl h-xl text-text-muted animate-spin-slow" />
                      <span className="font-mono text-[11px] text-text-secondary">Select a gate marker on the stadium diagram to query dynamic sensor mesh data</span>
                    </div>
                  )}
                </div>

              </div>
            </Card>
  );
}