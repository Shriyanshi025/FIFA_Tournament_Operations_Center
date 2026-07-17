import * as React from "react";
import { 
  Settings2, HelpCircle, Layout, Activity, AlertOctagon, Map, UserCheck, RefreshCw, Globe, Calendar, Users, TrendingUp, Train, Clock, HeartPulse, CloudSun, AlertTriangle, Play, Pause, RotateCcw, Gauge, CheckCircle2, XCircle, TrendingDown, ShieldAlert, Sliders, Send, Sparkles, MapPin, Flame, Thermometer, CloudRain, Compass
} from "lucide-react";
import { MatchStatus, DecisionState, ActionPriority, TransportLine } from "../types";
import { AIRequestManager, AIAuditLayer, PromptRegistry, AIAuditEntry } from "../services/aiRuntime";
import { useShell } from "../layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Alert, Input, Spinner } from "../components";
import { useTournament } from "../context/TournamentContext";
import { useCollaboration } from "../context/CollaborationContext";

import { TransportationWidget } from "../components/dashboard/TransportationWidget";
import { SustainabilityWidget } from "../components/dashboard/SustainabilityWidget";
import { AnalyticsWidget } from "../components/dashboard/AnalyticsWidget";


export function TelemetryView() {
  const { incidents, gates, matches, transportLines } = useTournament();
  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();



  return (
    <Card shadow="medium" className="p-lg space-y-md border border-border bg-surface" id="telemetry-view-panel">
              <div className="flex items-center justify-between border-b border-border/40 pb-sm">
                <div className="flex items-center gap-xs">
                  <Activity className="w-xl h-xl text-secondary" aria-hidden="true" />
                  <div>
                    <h3 className="font-display font-semibold text-h2 text-text-primary">Live Ingress Flow Scorecard</h3>
                    <p className="text-text-secondary text-caption uppercase font-mono">Real-time Turnstile Throughput & Service Headways</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-text-muted hidden md:inline bg-background px-xs py-1xs border rounded-xs">
                  Source: Gate Cluster Sensor Array
                </span>
              </div>

              {/* Transit line status block */}
              <div className="space-y-xs text-left">
                <span className="font-mono text-[10px] text-text-muted font-bold block uppercase pb-xs">Public Transport Headway Schedules</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm" id="transit-schedules-grid">
                  {transportLines.map((t: TransportLine) => (
                    <div key={t.id} className="p-sm bg-background border rounded-sm flex items-center justify-between gap-sm">
                      <div className="space-y-[2px]">
                        <div className="flex items-center gap-xs">
                          <Train className="w-4 h-4 text-primary" />
                          <span className="font-mono font-bold text-text-primary">{t.name}</span>
                          <Badge variant={t.status === "NOMINAL" ? "success" : t.status === "DELAYED" ? "warning" : "critical"} size="sm">
                            {t.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-text-secondary">{t.currentAdvisory}</p>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className="text-[10px] text-text-muted block uppercase">HEADWAY</span>
                        <span className="text-body-base font-bold text-text-primary">
                          {t.headwayMinutes === 999 ? "SUSPENDED" : `${t.headwayMinutes} mins`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid scorecard items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md pt-sm" id="telemetry-mock-grids">
                {[
                  { 
                    name: "Peak Gate Ingress Velocity", 
                    rate: `${Math.max(...gates.map((g: { waitTimeMinutes: number; currentFlowRate: number }) => g.currentFlowRate))} Fans/m`, 
                    state: Math.max(...gates.map((g: { waitTimeMinutes: number; currentFlowRate: number }) => g.waitTimeMinutes)) >= 15 ? "High Congestion" : "Nominal Flow", 
                    desc: "Highest entrance stream calculated by optical gates sensors", 
                    color: Math.max(...gates.map((g: { waitTimeMinutes: number; currentFlowRate: number }) => g.waitTimeMinutes)) >= 15 ? "critical" as const : "success" as const 
                  },
                  { 
                    name: "Stadium Crowd Accumulation", 
                    rate: matches[0]?.attendance ? matches[0].attendance.toLocaleString() : "0", 
                    state: matches[0]?.status || "PRE_MATCH", 
                    desc: "Current scan in headcount totals within stadium bowl", 
                    color: "success" as const 
                  },
                  { 
                    name: "Active Volunteer Stewards", 
                    rate: "240 Active", 
                    state: "Fully Staffed", 
                    desc: "Assigned personnel actively coordinating concourse bottlenecks", 
                    color: "success" as const 
                  },
                  { 
                    name: "Medical Dispatch Stations", 
                    rate: "8 Locations", 
                    state: incidents.some((i: { category: string; status: string }) => i.category === "MEDICAL" && i.status !== "RESOLVED") ? "Active Responds" : "Nominal Triage", 
                    desc: "Response crews stationed across stadium quadrants", 
                    color: incidents.some((i: { category: string; status: string }) => i.category === "MEDICAL" && i.status !== "RESOLVED") ? "warning" as const : "success" as const 
                  },
                  { 
                    name: "Accessibility Support Tickets", 
                    rate: `${incidents.filter((i: { category: string; status: string }) => i.category === "FACILITIES" && i.status !== "RESOLVED").length} Open Logs`, 
                    state: incidents.some((i: { category: string; status: string }) => i.category === "FACILITIES" && i.status !== "RESOLVED") ? "Pending Technician" : "Fully Clear", 
                    desc: "Active assistance logs logged for escalators or elevators", 
                    color: incidents.some((i: { category: string; status: string }) => i.category === "FACILITIES" && i.status !== "RESOLVED") ? "warning" as const : "success" as const 
                  },
                  { 
                    name: "Spectator Satisfaction Kiosks", 
                    rate: "94% Positive", 
                    state: "Excellent", 
                    desc: "Real-time flow ratings submitted by fans at exit concourses", 
                    color: "success" as const 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-background/40 border border-border/80 p-sm rounded-sm text-left flex flex-col justify-between space-y-sm" id={`telemetry-mock-card-${idx}`}>
                    <div>
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider block">{item.name}</span>
                      <div className="text-h2 font-display font-bold text-text-primary mt-1xs">{item.rate}</div>
                      <p className="text-[10px] text-text-secondary leading-normal mt-[2px]">{item.desc}</p>
                    </div>
                    <Badge variant={item.color} size="sm" className="w-fit">
                      {item.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
  );
}