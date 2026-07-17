import { WeatherWidget } from "../components/dashboard/WeatherWidget";
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

import { ExecutiveOverviewWidget } from "../components/dashboard/ExecutiveOverviewWidget";
import { LiveCrowdWidget } from "../components/dashboard/LiveCrowdWidget";
import { IncidentOperationsWidget } from "../components/dashboard/IncidentOperationsWidget";
import { RecommendationCenterWidget } from "../components/dashboard/RecommendationCenterWidget";
import { HumanWorkflowWidget } from "../components/dashboard/HumanWorkflowWidget";
import { ResourceWidget } from "../components/dashboard/ResourceWidget";
import { TransportationWidget } from "../components/dashboard/TransportationWidget";
import { SustainabilityWidget } from "../components/dashboard/SustainabilityWidget";
import { AnalyticsWidget } from "../components/dashboard/AnalyticsWidget";
import { LiveCollaborationWidget } from "../components/dashboard/LiveCollaborationWidget";


interface DashboardViewProps {
  formatSimTime: (isoString: string) => string;
  setWalkthroughStep: React.Dispatch<React.SetStateAction<number | null>>;
  selectedScenarioId: string;
  setSelectedScenarioId: React.Dispatch<React.SetStateAction<string>>;
}

export function DashboardView({ formatSimTime, setWalkthroughStep, selectedScenarioId, setSelectedScenarioId }: DashboardViewProps) {
  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();

  const {
    incidents, gates, crowdZones, volunteers, medicalTeams, securityTeams, resources, accessibilityResources, matches, transportLines, weather, recommendations, selectedIncidentId, setSelectedIncidentId, selectedGateId, setSelectedGateId, selectedSector, setSelectedSector, searchQuery, setSearchQuery, isLoading, simulationActive, simulationScenario, availableScenarios, simulationEngineState, notifications, unreadNotificationCount, reloadAllState, createIncident, updateIncidentStatus, assignStaffToIncident, updateGateStatus, resolveRecommendation, publishNotification, markNotificationAsRead, markAllNotificationsRead, startScenario, stopScenario, setSimulationPaused, setSimulationSpeed, resetSimulation
  } = useTournament();

  const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg" id="dashboard-view-panel">
              
              {/* LEFT & CENTER PANEL (Width: 2/3) */}
              <div className="xl:col-span-2 space-y-lg">
                
                {/* 0. OPERATIONAL COMMAND & SIMULATION SUITE */}
                <Card shadow="medium" className="p-lg border-2 border-primary/40 bg-surface space-y-md relative overflow-hidden" id="presentation-deck-hub">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-border/60 pb-md">
                    <div>
                      <span className="font-mono text-[9px] font-bold px-sm py-[2px] bg-secondary/15 text-secondary rounded-xs uppercase tracking-wider animate-pulse">
                        Operational Readiness Center
                      </span>
                      <h3 className="font-display font-bold text-h1 text-text-primary mt-xs">
                        Stadium Command & Dispatch Desk
                      </h3>
                      <p className="text-caption text-text-secondary leading-relaxed mt-1xs">
                        Control real-time systems, trigger multi-channel scenarios, and enter Executive Audit Mode to review AI impact KPIs.
                      </p>
                    </div>

                    <div className="flex items-center gap-sm flex-wrap shrink-0">
                      <Button
                        onClick={() => setWalkthroughStep(1)}
                        variant="primary"
                        size="sm"
                        className="font-bold flex items-center gap-xs text-[10px] bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90 transition-opacity shadow-md animate-pulse-gentle"
                        id="walkthrough-start-btn"
                      >
                        🏆 Take Guided Tour
                      </Button>

                      <div className="flex items-center gap-xs bg-background border rounded-md p-xs shadow-inner">
                        <span className="font-mono text-[10px] text-text-secondary font-bold px-xs">AUDIT SUITE</span>
                        <button
                          onClick={() => setIsJudgeMode(!isJudgeMode)}
                          className={`px-md py-xs rounded-xs font-sans text-xs font-bold transition-all cursor-pointer ${
                            isJudgeMode 
                              ? "bg-primary text-primary-fg shadow-md"
                              : "bg-surface hover:bg-surface-hover text-text-muted border"
                          }`}
                          id="judge-mode-toggle-btn"
                          role="switch"
                          aria-checked={isJudgeMode}
                        >
                          {isJudgeMode ? "ON" : "OFF"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ONE-CLICK SCENARIOS (SIMULATION MODE) */}
                  <div className="space-y-sm">
                    <div className="flex items-center gap-2xs">
                      <Sparkles className="w-5 h-5 text-secondary animate-pulse-gentle" />
                      <h4 className="font-display font-semibold text-body-base text-text-primary">One-Click Live Scenarios (Simulation Mode)</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-xs" id="demo-scenarios-grid">
                      {[
                        { id: "SC-NORMAL", label: "Normal Match", icon: Activity, color: "text-success border-success/20 bg-success/5" },
                        { id: "SC-SOLD-OUT", label: "Crowd Surge", icon: Users, color: "text-warning border-warning/20 bg-warning/5" },
                        { id: "SC-HEAT", label: "Medical Alert", icon: HeartPulse, color: "text-error border-error/20 bg-error/5" },
                        { id: "SC-HIGH-RISK", label: "Security Threat", icon: ShieldAlert, color: "text-error border-error/20 bg-error/5" },
                        { id: "SC-STRIKE", label: "Metro Failure", icon: Train, color: "text-warning border-warning/20 bg-warning/5" },
                        { id: "SC-RAIN", label: "Heavy Rain", icon: CloudRain, color: "text-primary border-primary/20 bg-primary/5" },
                        { id: "SC-VIP", label: "VIP Arrival", icon: Sparkles, color: "text-secondary border-secondary/20 bg-secondary/5" },
                        { id: "SC-POWER", label: "Power Failure", icon: AlertOctagon, color: "text-error border-error/20 bg-error/5" },
                        { id: "SC-ACCESS", label: "Accessibility", icon: UserCheck, color: "text-success border-success/20 bg-success/5" },
                        { id: "SC-EVAC", label: "Evacuation", icon: Flame, color: "text-error border-error/20 bg-error/5" },
                      ].map((sc) => {
                        const IconComponent = sc.icon;
                        const isActive = simulationEngineState.activeScenarioId === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => {
                              startScenario(sc.id);
                              setSimulationPaused(false);
                              setSimulationSpeed(5); // Run fast for active auditing
                            }}
                            className={`p-xs rounded-md border text-left flex flex-col justify-between h-20 transition-all hover:scale-102 hover:shadow-md cursor-pointer ${
                              isActive 
                                ? "ring-2 ring-primary border-primary bg-primary/10" 
                                : "bg-background/40 border-border hover:bg-background/80"
                            }`}
                            title={`Instantly activate scenario: ${sc.label}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <IconComponent className={`w-4 h-4 ${sc.color.split(" ")[0]}`} />
                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                              )}
                            </div>
                            <div className="space-y-[2px]">
                              <span className="font-mono text-[9px] text-text-muted font-bold block">SCENARIO</span>
                              <span className="font-sans font-bold text-[11px] text-text-primary block truncate">{sc.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* ⚖️ FIFA OPERATIONAL COGNITIVE KPI BOARD (Analytical Mode Active) */}
                {isJudgeMode && (
                  <Card shadow="medium" className="p-lg border-2 border-secondary/40 bg-surface space-y-md relative overflow-hidden" id="judge-kpis-panel">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -z-10" />
                    
                    <div className="border-b border-border/60 pb-sm flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-bold text-h2 text-text-primary flex items-center gap-xs">
                          ⚖️ Stadium Operations Review Board (Analytical Mode Active)
                        </h4>
                        <p className="text-caption text-text-secondary">High-level KPIs, AI Recommendation confidence scores, and system action impact logs.</p>
                      </div>
                      <Badge variant="warning" size="md" showShapeSymbol>Active Audit Review</Badge>
                    </div>

                    {/* A. Dynamic KPI Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
                      <div className="p-md bg-background/50 border rounded-md text-left">
                        <span className="font-mono text-[9px] text-text-muted block font-bold uppercase">CROWD SAFETY SLA</span>
                        <div className="text-h1 font-display font-bold text-success mt-xs">99.8%</div>
                        <span className="font-mono text-[9px] text-success font-semibold">OPTIMAL (Target: &gt;95%)</span>
                      </div>

                      <div className="p-md bg-background/50 border rounded-md text-left">
                        <span className="font-mono text-[9px] text-text-muted block font-bold uppercase">DISPATCH VELOCITY</span>
                        <div className="text-h1 font-display font-bold text-primary mt-xs">1.8m</div>
                        <span className="font-mono text-[9px] text-primary font-semibold">SAVED (Avg response)</span>
                      </div>

                      <div className="p-md bg-background/50 border rounded-md text-left">
                        <span className="font-mono text-[9px] text-text-muted block font-bold uppercase">AI RECOMMENDATION SLA</span>
                        <div className="text-h1 font-display font-bold text-secondary mt-xs">97.4%</div>
                        <span className="font-mono text-[9px] text-secondary font-semibold">SLA ACCEPTANCE RATE</span>
                      </div>

                      <div className="p-md bg-background/50 border rounded-md text-left">
                        <span className="font-mono text-[9px] text-text-muted block font-bold uppercase">ACTIVE SENSOR FLOW</span>
                        <div className="text-h1 font-display font-bold text-text-primary mt-xs">4,820</div>
                        <span className="font-mono text-[9px] text-text-secondary font-semibold">FANS / MIN INGRESS</span>
                      </div>

                      <div className="p-md bg-background/50 border rounded-md text-left col-span-2 md:col-span-1">
                        <span className="font-mono text-[9px] text-text-muted block font-bold uppercase">CARBON REDUCTION</span>
                        <div className="text-h1 font-display font-bold text-success mt-xs">-12%</div>
                        <span className="font-mono text-[9px] text-success font-semibold">TRANSIT LOAD BALANCING</span>
                      </div>
                    </div>

                    {/* B. Highlight AI Recommendations & Operational Timeline */}
                    <div className="space-y-sm text-left pt-xs">
                      <h4 className="font-display font-semibold text-body-base text-text-primary">Executive Cognitive Action Registry</h4>
                      
                      <div className="border border-border/80 rounded-sm divide-y divide-border/60">
                        {/* Static/Dynamic timeline mapping matches user scenarios */}
                        {incidents.filter(i => i.status !== "RESOLVED").length === 0 ? (
                          <div className="p-lg text-center font-mono text-caption text-text-muted">
                            All operational systems nominal. Click a scenario button above to inject an emergency, generate an AI recommendation, and track the timeline.
                          </div>
                        ) : (
                          incidents.filter(i => i.status !== "RESOLVED").map((inc) => {
                            const rec = recommendations.find(r => r.incidentId === inc.id);
                            const badgeVariant = inc.severity === "CRITICAL" ? "critical" : "warning";
                            
                            return (
                              <div key={inc.id} className="p-md bg-background/20 hover:bg-background/40 transition-colors space-y-md">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
                                  <div className="flex items-center gap-xs flex-wrap">
                                    <Badge variant={badgeVariant}>{inc.severity} Severity</Badge>
                                    <span className="font-mono text-caption font-bold text-text-primary">{inc.id}</span>
                                    <span className="text-text-muted">•</span>
                                    <span className="font-mono text-primary text-caption font-bold">{inc.location.sector} ({inc.location.section})</span>
                                  </div>
                                  <div className="font-mono text-[10px] text-text-muted">
                                    Simulated Timestamp: {formatSimTime(simulationEngineState.simulationTime)}
                                  </div>
                                </div>

                                <div className="space-y-xs">
                                  <div className="font-sans font-bold text-caption text-text-primary">Scenario/Incident raised:</div>
                                  <p className="text-text-secondary text-caption leading-relaxed pl-sm border-l-2 border-border/80 font-medium">
                                    {inc.description}
                                  </p>
                                </div>

                                {rec ? (
                                  <div className="bg-secondary/5 border border-secondary/30 rounded-xs p-md space-y-sm">
                                    <div className="flex items-center justify-between flex-wrap gap-xs border-b border-secondary/20 pb-xs">
                                      <div className="flex items-center gap-xs">
                                        <Sparkles className="w-4 h-4 text-secondary" />
                                        <span className="font-sans font-bold text-caption text-text-primary">AI Decision Recommendation: {rec.title}</span>
                                      </div>
                                      <Badge variant="info" size="sm">Confidence: {Math.floor(rec.confidenceScore * 100)}%</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-sm text-caption">
                                      <div className="space-y-xs">
                                        <span className="font-mono text-[9px] text-text-secondary font-bold block uppercase">Recommended Intervention</span>
                                        <p className="text-text-primary font-medium">{rec.recommendedAction}</p>
                                      </div>
                                      <div className="space-y-xs">
                                        <span className="font-mono text-[9px] text-text-secondary font-bold block uppercase">Measurable Target Outcome</span>
                                        <p className="text-success font-medium">{rec.expectedOutcome}</p>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-xs pt-xs border-t border-secondary/20">
                                      {rec.status === DecisionState.APPROVED ? (
                                        <span className="text-success font-mono font-bold text-caption flex items-center gap-1xs">
                                          <CheckCircle2 className="w-4 h-4" />
                                          Approved by Human Operator (Status Active)
                                        </span>
                                      ) : (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => resolveRecommendation(rec.id, DecisionState.APPROVED)}
                                          className="text-[10px] font-bold"
                                        >
                                          Approve Operational Intervention
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-mono text-[10px] text-text-muted italic bg-background/50 p-xs text-center border border-dashed rounded-xs">
                                    Evaluating situation with Google Gemini LLM context engine...
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* 1. COMPREHENSIVE SIMULATION ENGINE CONTROLLER CARD */}
                {!isJudgeMode && (
                  <Card shadow="medium" className="p-lg border border-border bg-surface space-y-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs pb-xs border-b border-border/60">
                    <div>
                      <span className="font-mono text-[9px] font-bold px-2xs py-[2px] bg-primary/15 text-primary rounded-xs uppercase tracking-wider">
                        Event-Driven Engine Panel
                      </span>
                      <h3 className="font-display font-semibold text-h2 text-text-primary mt-1xs">
                        Simulation Flight Deck
                      </h3>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="text-right font-mono">
                        <div className="text-[9px] text-text-muted">VIRTUAL TIMELINE</div>
                        <div className="text-body-base font-bold text-secondary animate-pulse-gentle">
                          {formatSimTime(simulationEngineState.simulationTime)}
                        </div>
                      </div>
                      <Badge 
                        variant={simulationEngineState.isPaused ? "neutral" : "success"}
                        size="md"
                        showShapeSymbol
                      >
                        {simulationEngineState.isPaused ? "PAUSED" : "RUNNING"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-text-secondary text-caption leading-relaxed">
                    This control dashboard operates the core event scheduler and time dilation module. Choose a pre-configured scenario below to inject realistic match-day bottlenecks, emergencies, and weather patterns.
                  </p>

                  {/* Operational controls button strip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm bg-background/50 p-md border rounded-sm">
                    {/* Time & speed knobs */}
                    <div className="space-y-sm">
                      <span className="font-mono text-[10px] text-text-muted block font-semibold uppercase">Engine Controls</span>
                      <div className="flex flex-wrap gap-xs">
                        {simulationEngineState.isPaused ? (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => setSimulationPaused(false)}
                            className="gap-2xs text-xs font-bold"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Resume</span>
                          </Button>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSimulationPaused(true)}
                            className="gap-2xs text-xs font-bold"
                          >
                            <Pause className="w-4 h-4" />
                            <span>Pause</span>
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={resetSimulation}
                          className="gap-2xs text-xs"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Database</span>
                        </Button>
                      </div>

                      <div className="space-y-1xs pt-xs">
                        <span className="font-mono text-[10px] text-text-secondary block">Dilation Speed Factor:</span>
                        <div className="flex gap-1xs">
                          {[1, 2, 5, 10].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setSimulationSpeed(speed)}
                              className={`px-sm py-1xs rounded-xs font-mono text-[10px] border cursor-pointer font-bold ${
                                simulationEngineState.speedMultiplier === speed
                                  ? "bg-secondary text-surface border-secondary"
                                  : "bg-background border-border text-text-secondary hover:bg-surface-hover"
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Scenario loader dropdown */}
                    <div className="space-y-sm border-t md:border-t-0 md:border-l border-border/60 pt-sm md:pt-0 md:pl-md">
                      <span className="font-mono text-[10px] text-text-muted block font-semibold uppercase">Scenario Loader</span>
                      <div className="space-y-xs">
                        <select
                          value={selectedScenarioId}
                          onChange={(e) => setSelectedScenarioId(e.target.value)}
                          className="w-full text-caption bg-background border border-border rounded-xs px-sm py-1xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text-primary font-sans font-medium"
                        >
                          {availableScenarios.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name}
                            </option>
                          ))}
                        </select>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => {
                            startScenario(selectedScenarioId);
                          }}
                          className="w-full text-xs font-bold gap-2xs"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>Deploy Selected Scenario</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Active telemetry ticks strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm text-[10px] font-mono text-text-muted pt-xs">
                    <div className="flex gap-md">
                      <span>STRETCH STAGE: <strong className="text-text-primary uppercase">{simulationEngineState.currentStage}</strong></span>
                      <span>TICKS ACTIVE: <strong className="text-text-primary">{simulationEngineState.tickCount}</strong></span>
                    </div>
                    <span>CALIBRATION: DETERMINISTIC SCHEDULER</span>
                  </div>
                </Card>
                )}

                {/* MODULAR OPERATION TABS SELECTION STRIP */}
                <div className="border-b border-border flex flex-wrap gap-xs pb-[1px]" id="dashboard-subtabs-strip">
                  {[
                    { id: "live-ops", label: "🚨 Live Ingress" },
                    { id: "incidents", label: "⚠️ Incidents & Teams" },
                    { id: "copilot", label: "🤖 AI Copilot" },
                    { id: "logistics", label: "🚇 Transit & Green" },
                    { id: "analytics", label: "📊 Analytics & KPIs" },
                    { id: "collaboration", label: "👥 Live Collab" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDashTab(tab.id)}
                      className={`px-md py-sm font-display font-semibold text-caption border-b-2 transition-all cursor-pointer ${
                        dashTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TABBED INTERACTIVE CONTENT PANEL */}
                <div className="space-y-lg transition-all" id="dashboard-tabbed-content">
                  {dashTab === "live-ops" && (
                    <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                      <div className="border-b pb-xs flex justify-between items-center">
                        <div>
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Executive Overview</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Global Command HUD</p>
                        </div>
                      </div>
                      <ExecutiveOverviewWidget />
                      
                      <div className="border-b pb-xs pt-md flex justify-between items-center">
                        <div>
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Ingress Gate Flows</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Turnstiles & Crowd Levels</p>
                        </div>
                      </div>
                      <LiveCrowdWidget />
                    </Card>
                  )}

                  {dashTab === "incidents" && (
                    <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
                      <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                        <div className="border-b pb-xs">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Incident Command Registry</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Real-time alerts, timeline, & dispatch</p>
                        </div>
                        <IncidentOperationsWidget />

                        <div className="border-b pb-xs pt-md">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Field Response Resources</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Volunteers, security, & medical hubs</p>
                        </div>
                        <ResourceWidget />
                      </Card>
                    </React.Suspense>
                  )}

                  {dashTab === "copilot" && (
                    <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
                      <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                        <div className="border-b pb-xs">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Operational Strategy Center</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">AI recommendation dispatch engine</p>
                        </div>
                        <RecommendationCenterWidget />

                        <div className="border-b pb-xs pt-md">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Human Workflow Queue</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Accountable coordination statistics</p>
                        </div>
                        <HumanWorkflowWidget />
                      </Card>
                    </React.Suspense>
                  )}

                  {dashTab === "logistics" && (
                    <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
                      <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                        <div className="border-b pb-xs">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Metropolitan Transit Board</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Schedules, loads, and park structures</p>
                        </div>
                        <TransportationWidget />

                        <div className="border-b pb-xs pt-md">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Environmental Telemetry</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Green sustainability load tracking</p>
                        </div>
                        <SustainabilityWidget />
                      </Card>
                    </React.Suspense>
                  )}

                  {dashTab === "analytics" && (
                    <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
                      <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                        <div className="border-b pb-xs">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Operations KPI Analytics</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Dispatch latencies and performance charts</p>
                        </div>
                        <AnalyticsWidget />
                      </Card>
                    </React.Suspense>
                  )}

                  {dashTab === "collaboration" && (
                    <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
                      <Card shadow="medium" className="p-lg border border-border bg-surface space-y-lg">
                        <div className="border-b pb-xs">
                          <h3 className="font-display font-semibold text-h2 text-text-primary">Real-Time Distributed Collaboration Hub</h3>
                          <p className="text-caption font-mono text-text-muted uppercase">Presence tracking, leasing locks, operational messaging, & offline buffers</p>
                        </div>
                        <LiveCollaborationWidget />
                      </Card>
                    </React.Suspense>
                  )}
                </div>

              </div>

              {/* RIGHT SIDEBAR PANEL (Width: 1/3) - Pinned elements visible in all tabs! */}
              <div className="space-y-lg">
                
                {/* 1. PINNED SCOREBOARD */}
                {matches.map((m) => (
                  <Card key={m.id} shadow="medium" className="p-lg border border-border bg-surface space-y-md">
                    <div className="flex items-center justify-between border-b border-border/40 pb-xs">
                      <div className="flex items-center gap-xs">
                        <Calendar className="w-md h-md text-primary" />
                        <span className="font-mono text-caption uppercase text-text-secondary">Fixture Pairing {m.id} • {m.stadiumId}</span>
                      </div>
                      <Badge 
                        variant={m.status === MatchStatus.LIVE ? "critical" : "neutral"}
                        size="sm"
                        showShapeSymbol={m.status === MatchStatus.LIVE}
                      >
                        {m.status === MatchStatus.LIVE ? "LIVE MATCH" : m.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-around py-sm">
                      {/* France Team */}
                      <div className="text-center space-y-xs w-1/3">
                        <div className="w-xl h-xl mx-auto rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-h2">
                          FR
                        </div>
                        <h4 className="font-display font-bold text-body-base text-text-primary">France</h4>
                        <span className="font-mono text-[10px] text-text-muted">Home Squad</span>
                      </div>

                      {/* SCOREBOARD COUNTER */}
                      <div className="text-center space-y-2xs w-1/3">
                        <div className="text-display-lg font-display font-bold tracking-wider text-text-primary flex items-center justify-center gap-xs">
                          <span>{m.scoreHome}</span>
                          <span className="text-text-muted text-h1">:</span>
                          <span>{m.scoreAway}</span>
                        </div>
                        {m.status === MatchStatus.LIVE && (
                          <div className="font-mono text-caption text-secondary font-bold flex items-center justify-center gap-xs animate-pulse-gentle">
                            <Clock className="w-3 h-3" />
                            <span>{m.currentMinute || 0}' MIN</span>
                          </div>
                        )}
                      </div>

                      {/* Argentina Team */}
                      <div className="text-center space-y-xs w-1/3">
                        <div className="w-xl h-xl mx-auto rounded-full bg-secondary/25 flex items-center justify-center font-display font-bold text-secondary text-h2">
                          AR
                        </div>
                        <h4 className="font-display font-bold text-body-base text-text-primary">Argentina</h4>
                        <span className="font-mono text-[10px] text-text-muted">Away Squad</span>
                      </div>
                    </div>

                    {/* Progress tracking bar */}
                    {m.status === MatchStatus.LIVE && (
                      <div className="space-y-xs">
                        <div className="flex justify-between font-mono text-[10px] text-text-secondary">
                          <span>First Half</span>
                          <span>Halftime</span>
                          <span>Second Half</span>
                        </div>
                        <div className="w-full bg-background border h-xs rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, ((m.currentMinute || 0) / 90) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}

                {/* 2. PINNED ENVIRONMENTAL RADAR REPORT */}
                <Card shadow="medium" className="p-lg border border-border bg-surface space-y-xs">
                  <div className="flex items-center gap-2xs pb-xs border-b border-border/40">
                    <CloudSun className="w-xl h-xl text-primary" />
                    <h3 className="font-display font-semibold text-h2 text-text-primary">Live Microclimate Radar</h3>
                  </div>
                  <WeatherWidget />
                </Card>

                {/* 3. PINNED MATCHDAY SYSTEM LOGS */}
                <Card shadow="medium" className="p-lg border border-border bg-surface space-y-md">
                  <div className="flex items-center justify-between pb-xs border-b border-border/40">
                    <div className="flex items-center gap-2xs">
                      <Clock className="w-xl h-xl text-primary" />
                      <h3 className="font-display font-semibold text-h2 text-text-primary">System Log Alerts</h3>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="font-mono text-[9px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Read All ({unreadNotificationCount})
                      </button>
                    )}
                  </div>

                  <div className="space-y-xs max-h-[250px] overflow-y-auto pr-xs" id="simulation-notifications-scroller">
                    {notifications.length === 0 ? (
                      <div className="text-center py-md font-mono text-[10px] text-text-muted">
                        No active operational logs.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => {
                        const alertColor = n.severity === "CRITICAL" 
                          ? "border-error/30 bg-error/5" 
                          : n.severity === "WARNING"
                          ? "border-warning/30 bg-warning/5"
                          : "border-border/60 bg-background/50";
                        const textSeverityColor = n.severity === "CRITICAL" ? "text-error" : n.severity === "WARNING" ? "text-warning" : "text-text-secondary";

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-sm border rounded-xs text-left cursor-pointer transition-colors hover:bg-surface-hover/30 space-y-2xs ${alertColor}`}
                          >
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className={`font-bold ${textSeverityColor}`}>{n.category} • {n.severity}</span>
                              <span className="text-text-muted">{formatSimTime(n.timestamp)}</span>
                            </div>
                            <h5 className="font-sans font-bold text-[11px] text-text-primary">{n.title}</h5>
                            <p className="text-[10px] text-text-secondary leading-normal">{n.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

              </div>

            </div>
  );
}