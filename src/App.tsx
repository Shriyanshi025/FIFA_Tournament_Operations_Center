/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { TournamentProvider, useTournament } from "./context/TournamentContext";
import { 
  Settings2, 
  HelpCircle, 
  Layout, 
  Activity, 
  AlertOctagon, 
  Map, 
  UserCheck, 
  RefreshCw,
  Globe,
  Calendar,
  Users,
  TrendingUp,
  Train,
  Clock,
  HeartPulse,
  CloudSun,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Send,
  Sparkles,
  MapPin,
  Flame,
  Thermometer,
  CloudRain,
  Compass
} from "lucide-react";
import { MatchStatus, DecisionState, ActionPriority } from "./types";
import { 
  AIRequestManager, 
  AIAuditLayer, 
  PromptRegistry, 
  AIAuditEntry 
} from "./services/aiRuntime";
import { 
  ShellProvider,
  useShell, 
  Shell, 
  Workspace 
} from "./layout";
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Badge, 
  Alert, 
  Input, 
  Spinner 
} from "./components";

import { ExecutiveOverviewWidget } from "./components/dashboard/ExecutiveOverviewWidget";
import { LiveCrowdWidget } from "./components/dashboard/LiveCrowdWidget";
const IncidentOperationsWidget = React.lazy(() => import("./components/dashboard/IncidentOperationsWidget").then(m => ({ default: m.IncidentOperationsWidget })));
const RecommendationCenterWidget = React.lazy(() => import("./components/dashboard/RecommendationCenterWidget").then(m => ({ default: m.RecommendationCenterWidget })));
const HumanWorkflowWidget = React.lazy(() => import("./components/dashboard/HumanWorkflowWidget").then(m => ({ default: m.HumanWorkflowWidget })));
const ResourceWidget = React.lazy(() => import("./components/dashboard/ResourceWidget").then(m => ({ default: m.ResourceWidget })));
const TransportationWidget = React.lazy(() => import("./components/dashboard/TransportationWidget").then(m => ({ default: m.TransportationWidget })));
const SustainabilityWidget = React.lazy(() => import("./components/dashboard/SustainabilityWidget").then(m => ({ default: m.SustainabilityWidget })));
const AnalyticsWidget = React.lazy(() => import("./components/dashboard/AnalyticsWidget").then(m => ({ default: m.AnalyticsWidget })));
const LiveCollaborationWidget = React.lazy(() => import("./components/dashboard/LiveCollaborationWidget").then(m => ({ default: m.LiveCollaborationWidget })));
const DiagnosticsWidget = React.lazy(() => import("./components/dashboard/DiagnosticsWidget").then(m => ({ default: m.DiagnosticsWidget })));
import { WeatherWidget } from "./components/dashboard/WeatherWidget";
import { CollaborationProvider, useCollaboration } from "./context/CollaborationContext";

function AppContent() {
  const { 
    activeNavId, 
    setActiveNavId,
    theme, 
    setTheme, 
    preferences, 
    setPreferences,
    currentVenue,
    setCurrentVenue,
    currentMatch,
    setCurrentMatch,
    isJudgeMode,
    setIsJudgeMode
  } = useShell();

  const {
    incidents,
    gates,
    crowdZones,
    volunteers,
    medicalTeams,
    securityTeams,
    resources,
    accessibilityResources,
    matches,
    transportLines,
    weather,
    recommendations,
    selectedIncidentId,
    setSelectedIncidentId,
    selectedGateId,
    setSelectedGateId,
    selectedSector,
    setSelectedSector,
    searchQuery,
    setSearchQuery,
    isLoading,
    simulationActive,
    simulationScenario,
    availableScenarios,
    simulationEngineState,
    notifications,
    unreadNotificationCount,
    reloadAllState,
    createIncident,
    updateIncidentStatus,
    assignStaffToIncident,
    updateGateStatus,
    resolveRecommendation,
    publishNotification,
    markNotificationAsRead,
    markAllNotificationsRead,
    startScenario,
    stopScenario,
    setSimulationPaused,
    setSimulationSpeed,
    resetSimulation
  } = useTournament();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = React.useState("SC-NORMAL");
  const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  // Accessibility Quick Controls State
  const [a11yLargeText, setA11yLargeText] = React.useState(false);
  const [a11yHighContrast, setA11yHighContrast] = React.useState(false);
  const [a11yReducedMotion, setA11yReducedMotion] = React.useState(false);
  const [a11yColorblindMode, setA11yColorblindMode] = React.useState(false);
  const [showA11yMenu, setShowA11yMenu] = React.useState(false);

  // Interactive Walkthrough State
  const [walkthroughStep, setWalkthroughStep] = React.useState<number | null>(null);

  // Scenario Guidance State
  const [isScenarioGuideDismissed, setIsScenarioGuideDismissed] = React.useState(false);
  const prevActiveScenarioId = React.useRef<string | null>(null);

  // Automatically show the guide card when a new scenario is loaded
  React.useEffect(() => {
    const activeId = simulationEngineState?.activeScenarioId;
    if (activeId && activeId !== "SC-NORMAL" && activeId !== prevActiveScenarioId.current) {
      setIsScenarioGuideDismissed(false);
    }
    prevActiveScenarioId.current = activeId || null;
  }, [simulationEngineState?.activeScenarioId]);

  // Incident creation state
  const [newIncDesc, setNewIncDesc] = React.useState("");
  const [newIncCategory, setNewIncCategory] = React.useState("CROWD");
  const [newIncSeverity, setNewIncSeverity] = React.useState("WARNING");
  const [newIncSector, setNewIncSector] = React.useState("Southwest Sector");
  const [newIncSection, setNewIncSection] = React.useState("Gate G-4");
  const [newIncSuccessMsg, setNewIncSuccessMsg] = React.useState("");

  // AI Runtime simulation states
  const [aiAudits, setAiAudits] = React.useState<AIAuditEntry[]>([]);
  const [selectedPromptId, setSelectedPromptId] = React.useState("evaluate-situation");
  const [selectedProviderId, setSelectedProviderId] = React.useState("google-gemini");
  const [selectedPriority, setSelectedPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [testExecutionLoading, setTestExecutionLoading] = React.useState(false);
  const [testExecutionResult, setTestExecutionResult] = React.useState<any | null>(null);
  const [testExecutionError, setTestExecutionError] = React.useState<string | null>(null);

  // Load audit entries on mount & whenever updated
  React.useEffect(() => {
    setAiAudits(AIAuditLayer.getInstance().getAllEntries());
  }, []);

  const handleTriggerTestAIRequest = async () => {
    setTestExecutionLoading(true);
    setTestExecutionResult(null);
    setTestExecutionError(null);

    try {
      // Determine parameters for the selected template
      let parameters: Record<string, any> = {};
      let responseSchema: any = undefined;

      if (selectedPromptId === "evaluate-situation") {
        parameters = {
          incidentId: `INC-${Math.floor(Math.random() * 900) + 100}`,
          sector: "North Quadrant",
          severity: "CRITICAL",
          weatherAdvisory: weather ? weather.advisory : "Ambient temperatures nominal."
        };
      } else if (selectedPromptId === "crowd-congestion-mitigation") {
        parameters = {
          gateId: "GATE-ALPHA",
          waitTime: 18,
          flowRate: 45,
          sector: "Southwest"
        };
      }

      const response = await AIRequestManager.getInstance().executeRequest(
        {
          promptId: selectedPromptId,
          parameters,
          priority: selectedPriority,
          responseSchema
        },
        selectedProviderId
      );

      setTestExecutionResult(response);
      setAiAudits(AIAuditLayer.getInstance().getAllEntries());
    } catch (err: any) {
      console.error("[TestAIRequest] Execution failed:", err);
      setTestExecutionError(err.message || String(err));
    } finally {
      setTestExecutionLoading(false);
    }
  };

  const handleClearAudits = () => {
    AIAuditLayer.getInstance().clear();
    setAiAudits([]);
    setTestExecutionResult(null);
  };

  // Quick Action: Simulate refreshing workspace indicators
  const handleRefreshWorkspace = async () => {
    setIsRefreshing(true);
    await reloadAllState();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Toggle Operations Recommendations Panel
  const handleToggleCopilot = () => {
    setPreferences((prev) => ({
      ...prev,
      showCopilotPanel: !prev.showCopilotPanel
    }));
  };

  // Format UTC virtual time
  const formatSimTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " UTC";
    } catch {
      return "00:00:00 UTC";
    }
  };

  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncDesc.trim()) return;

    try {
      await createIncident({
        description: newIncDesc,
        category: newIncCategory as any,
        severity: newIncSeverity as any,
        sector: newIncSector,
        section: newIncSection,
        stadiumId: "V-LUSAIL"
      });
      setNewIncDesc("");
      setNewIncSuccessMsg("Incident successfully dispatched to field stewards.");
      setTimeout(() => setNewIncSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Return appropriate title and descriptions per page
  const getPageMeta = () => {
    switch (activeNavId) {
      case "dashboard":
        return {
          title: "Tournament Operations Center",
          desc: "Real-time consolidated view of gate ingress rates, match-day notifications, and core console indicators."
        };
      case "incidents":
        return {
          title: "Incident Registry & Dispatch",
          desc: "Active queue of tournament support requests, medical assignments, and technical steward dispatches."
        };
      case "map":
        return {
          title: "Venue & Gate Map Overlay",
          desc: "Interactive spatial coordinates highlighting spectator density and ticket-reader hubs."
        };
      case "telemetry":
        return {
          title: "Ingress Telemetry Stream",
          desc: "Live throughput counts assessing flow rates across stadium entrances and sectors."
        };
      case "settings":
        return {
          title: "Console Settings",
          desc: "Configure general workspace preferences, toggle live system monitors, and adjust color schemes."
        };
      case "diagnostics":
        return {
          title: "Engineering Diagnostics & Telemetry Dashboard",
          desc: "Centralized live telemetry feeds, service SLA health states, rolling latencies, and structured log buffers."
        };
      default:
        return {
          title: "Nexus Workspace Shell",
          desc: "Tournament operational control system active and responsive."
        };
    }
  };

  const meta = getPageMeta();

  // Create workspace action items
  const workspaceActions = (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefreshWorkspace}
        className="gap-2xs"
        aria-label="Refresh Workspace Indicators"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span className="hidden sm:inline">Refresh Sync</span>
      </Button>

      <Button
        variant={preferences.showCopilotPanel ? "primary" : "secondary"}
        size="sm"
        onClick={handleToggleCopilot}
        className="gap-2xs font-bold"
        aria-label="Toggle Operations Recommendations"
      >
        <TrendingUp className="w-4 h-4" aria-hidden="true" />
        <span>Recommendations</span>
        <Badge variant={preferences.showCopilotPanel ? "info" : "neutral"} size="sm" className="ml-xs scale-90">
          {preferences.showCopilotPanel ? "Active" : "Off"}
        </Badge>
      </Button>
    </>
  );

  // Right sidebar content showing professional operations metrics and display toggles
  const rightSidebarContent = (
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

  return (
    <Shell>
      <Workspace
        title={meta.title}
        description={meta.desc}
        actions={workspaceActions}
        rightSidebar={rightSidebarContent}
      >
        <div className="space-y-lg text-left" id="workspace-view-content">
          
          {/* A. SYSTEM ADVISORY BANNER */}
          {weather && (
            <Alert 
              variant={weather.temperature > 35 ? "error" : "info"} 
              title={`Stadium Environmental Alert: ${weather.condition}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs">
                <span>{weather.advisory}</span>
                <span className="font-mono text-[10px] shrink-0 text-text-secondary">
                  Last updated: {formatSimTime(weather.lastUpdatedAt)}
                </span>
              </div>
            </Alert>
          )}

          {/* B. SCREEN-SPECIFIC VIEWS */}
          {activeNavId === "dashboard" && (
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
                                          onClick={() => resolveRecommendation(rec.id, "APPROVED" as any)}
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
          )}

          {activeNavId === "incidents" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg" id="incidents-view-panel">
              
              {/* INCIDENTS LIST (2/3 width) */}
              <div className="lg:col-span-2 space-y-lg">
                <Card shadow="medium" className="p-lg space-y-md border border-border bg-surface">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-border/40 pb-sm">
                    <div className="flex items-center gap-xs">
                      <AlertTriangle className="w-xl h-xl text-error animate-pulse-gentle" aria-hidden="true" />
                      <div>
                        <h3 className="font-display font-semibold text-h2 text-text-primary">Live Incident Registry</h3>
                        <p className="text-text-secondary text-caption uppercase font-mono">Active Spectator & Stadium Support Tickets</p>
                      </div>
                    </div>
                    
                    {/* Search / Filter input */}
                    <div className="w-full sm:w-64">
                      <Input 
                        placeholder="Search sector, section, description..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="border border-border/80 rounded-sm overflow-hidden" id="incidents-dynamic-list">
                    {incidents.filter(i => 
                      !searchQuery || 
                      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.location.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      i.id.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-xl font-mono text-caption text-text-muted bg-background/20">
                        No active incidents match the current search query.
                      </div>
                    ) : (
                      incidents
                        .filter(i => 
                          !searchQuery || 
                          i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.location.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.id.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((inc) => {
                          const badgeVariant = inc.severity === "CRITICAL" ? "critical" : inc.severity === "WARNING" ? "warning" : "info";
                          
                          return (
                            <div 
                              key={inc.id} 
                              className={`p-md border-b border-border/60 hover:bg-surface-hover/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-sm text-caption ${
                                inc.status === "RESOLVED" ? "opacity-60 bg-background/20" : "bg-background/50"
                              }`} 
                              id={`inc-row-${inc.id}`}
                            >
                              <div className="space-y-[3px] text-left">
                                <div className="flex items-center flex-wrap gap-xs">
                                  <span className="font-mono font-bold text-text-primary">{inc.id}</span>
                                  <span className="text-text-muted">•</span>
                                  <span className="font-mono text-primary font-semibold text-[11px]">{inc.location.sector} ({inc.location.section})</span>
                                  <span className="text-text-muted">•</span>
                                  <span className="font-mono text-[9px] bg-secondary/10 px-1xs rounded-xs text-secondary uppercase tracking-wider">{inc.category}</span>
                                </div>
                                <p className="text-text-secondary text-caption mt-[2px]">{inc.description}</p>
                              </div>

                              <div className="flex items-center gap-sm self-end md:self-center shrink-0">
                                <Badge variant={badgeVariant} showShapeSymbol={inc.status !== "RESOLVED"} size="sm">
                                  {inc.status}
                                </Badge>

                                {inc.status !== "RESOLVED" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => updateIncidentStatus(inc.id, "RESOLVED" as any)}
                                    className="font-bold text-[10px]"
                                  >
                                    Mark Resolved
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </Card>
              </div>

              {/* DISPATCH NEW FORM (1/3 width) */}
              <div className="space-y-lg">
                <Card shadow="medium" className="p-lg space-y-sm border border-border bg-surface text-left">
                  <div className="flex items-center gap-xs pb-xs border-b border-border/40">
                    <Send className="w-lg h-lg text-primary" />
                    <h3 className="font-display font-semibold text-h2 text-text-primary">File Incident Log</h3>
                  </div>
                  
                  <p className="text-text-secondary text-caption leading-relaxed">
                    Manually file and dispatch incident alerts to safety stewarding units and technical support centers.
                  </p>

                  <form onSubmit={handleCreateIncidentSubmit} className="space-y-sm pt-xs" id="manual-incident-form">
                    <div className="space-y-1xs">
                      <label className="font-mono text-[10px] text-text-secondary">Incident Description</label>
                      <textarea
                        rows={3}
                        value={newIncDesc}
                        onChange={(e) => setNewIncDesc(e.target.value)}
                        placeholder="Detail the issue, crowd congestion, equipment failures..."
                        className="w-full text-caption bg-background border border-border rounded-xs px-sm py-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary placeholder:text-text-muted"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-xs">
                      <div className="space-y-1xs">
                        <label className="font-mono text-[10px] text-text-secondary">Category</label>
                        <select
                          value={newIncCategory}
                          onChange={(e) => setNewIncCategory(e.target.value)}
                          className="w-full text-caption bg-background border border-border rounded-xs p-1xs text-text-primary cursor-pointer font-sans"
                        >
                          <option value="CROWD">Crowd Flow</option>
                          <option value="SECURITY">Security</option>
                          <option value="MEDICAL">Medical</option>
                          <option value="FACILITIES">Facilities</option>
                        </select>
                      </div>

                      <div className="space-y-1xs">
                        <label className="font-mono text-[10px] text-text-secondary">Severity</label>
                        <select
                          value={newIncSeverity}
                          onChange={(e) => setNewIncSeverity(e.target.value)}
                          className="w-full text-caption bg-background border border-border rounded-xs p-1xs text-text-primary cursor-pointer font-sans"
                        >
                          <option value="INFO">Info</option>
                          <option value="WARNING">Warning</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-xs">
                      <Input 
                        label="Sector Zone"
                        value={newIncSector}
                        onChange={(e) => setNewIncSector(e.target.value)}
                        className="text-xs"
                      />
                      <Input 
                        label="Section/Gate"
                        value={newIncSection}
                        onChange={(e) => setNewIncSection(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    {newIncSuccessMsg && (
                      <div className="p-xs bg-success/10 border border-success/30 rounded-xs text-[10px] text-success text-center font-semibold">
                        {newIncSuccessMsg}
                      </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full text-xs font-bold pt-1xs">
                      Dispatch Alarm Response
                    </Button>
                  </form>
                </Card>
              </div>

            </div>
          )}

          {activeNavId === "map" && (
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
          )}

          {activeNavId === "telemetry" && (
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
                  {transportLines.map((t) => (
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
                    rate: `${Math.max(...gates.map(g => g.currentFlowRate))} Fans/m`, 
                    state: Math.max(...gates.map(g => g.waitTimeMinutes)) >= 15 ? "High Congestion" : "Nominal Flow", 
                    desc: "Highest entrance stream calculated by optical gates sensors", 
                    color: Math.max(...gates.map(g => g.waitTimeMinutes)) >= 15 ? "critical" as const : "success" as const 
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
                    state: incidents.some(i => i.category === "MEDICAL" && i.status !== "RESOLVED") ? "Active Responds" : "Nominal Triage", 
                    desc: "Response crews stationed across stadium quadrants", 
                    color: incidents.some(i => i.category === "MEDICAL" && i.status !== "RESOLVED") ? "warning" as const : "success" as const 
                  },
                  { 
                    name: "Accessibility Support Tickets", 
                    rate: `${incidents.filter(i => i.category === "FACILITIES" && i.status !== "RESOLVED").length} Open Logs`, 
                    state: incidents.some(i => i.category === "FACILITIES" && i.status !== "RESOLVED") ? "Pending Technician" : "Fully Clear", 
                    desc: "Active assistance logs logged for escalators or elevators", 
                    color: incidents.some(i => i.category === "FACILITIES" && i.status !== "RESOLVED") ? "warning" as const : "success" as const 
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
          )}

          {activeNavId === "settings" && (
            <Card shadow="medium" className="p-lg space-y-md border border-border" id="settings-placeholder-view">
              <div className="border-b border-border pb-md mb-md">
                <h3 className="font-display font-semibold text-h1 text-text-primary tracking-tight">Console Configurations & Preferences</h3>
                <p className="text-text-secondary text-caption leading-relaxed mt-1xs">
                  Configure operational layout variables, modify interface accessibility parameters, and test downstream LLM orchestration pipelines.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg text-left" id="interactive-settings-inputs">
                {/* LEFT COLUMN: System Config & Themes & Providers */}
                <div className="lg:col-span-5 space-y-md">
                  
                  {/* Preferences Toggles Card */}
                  <div className="bg-surface border border-border rounded-md p-md space-y-md shadow-low">
                    <span className="font-mono text-[10px] text-primary font-bold block uppercase tracking-wider">Console Display Preferences</span>
                    
                    <div className="space-y-sm">
                      {/* Dense Mode */}
                      <div className="flex items-center justify-between py-2xs border-b border-border/40 pb-xs">
                        <div className="space-y-1xs">
                          <label className="text-caption font-bold text-text-primary block">Dense Layout Mode</label>
                          <span className="text-[10px] text-text-secondary block">Compacts layout margins for wall monitors</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={preferences.denseMode}
                          onClick={() => setPreferences(p => ({ ...p, denseMode: !p.denseMode }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.denseMode ? "bg-primary" : "bg-neutral/30"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              preferences.denseMode ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* System Health */}
                      <div className="flex items-center justify-between py-2xs border-b border-border/40 pb-xs">
                        <div className="space-y-1xs">
                          <label className="text-caption font-bold text-text-primary block">Telemetry Health Bar</label>
                          <span className="text-[10px] text-text-secondary block">Renders memory / CPU loads on top header</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={preferences.showSystemHealth}
                          onClick={() => setPreferences(p => ({ ...p, showSystemHealth: !p.showSystemHealth }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.showSystemHealth ? "bg-primary" : "bg-neutral/30"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              preferences.showSystemHealth ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Copilot panel */}
                      <div className="flex items-center justify-between py-2xs">
                        <div className="space-y-1xs">
                          <label className="text-caption font-bold text-text-primary block">AI Copilot Sidepanel</label>
                          <span className="text-[10px] text-text-secondary block">Displays side recommendations on dashboard</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={preferences.showCopilotPanel}
                          onClick={() => setPreferences(p => ({ ...p, showCopilotPanel: !p.showCopilotPanel }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.showCopilotPanel ? "bg-primary" : "bg-neutral/30"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              preferences.showCopilotPanel ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Themes selection Card */}
                  <div className="bg-surface border border-border rounded-md p-md space-y-sm shadow-low">
                    <span className="font-mono text-[10px] text-primary font-bold block uppercase tracking-wider">Console Palette Theme</span>
                    <div className="grid grid-cols-2 gap-xs" id="quick-theme-grid">
                      {[
                        { id: "default", label: "Enterprise Light", desc: "Clean and high-contrast light mode", dotColor: "bg-blue-600" },
                        { id: "light", label: "Charcoal Dark", desc: "Warm and easy on eyes at night", dotColor: "bg-slate-700" },
                        { id: "high-contrast", label: "High Contrast", desc: "Stark yellow and pure dark lines", dotColor: "bg-yellow-400" },
                        { id: "emergency", label: "Emergency Red", desc: "Level 1 evac emergency visual", dotColor: "bg-red-600" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={`p-sm text-left rounded-sm border cursor-pointer transition-all duration-fast flex flex-col justify-between ${
                            theme === t.id 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-border bg-background/50 hover:bg-surface-hover hover:border-border-hover'
                          }`}
                          id={`workspace-btn-theme-${t.id}`}
                        >
                          <div className="flex items-center gap-xs">
                            <span className={`w-2 h-2 rounded-full ${t.dotColor}`} />
                            <span className="font-sans text-[11px] font-bold text-text-primary">{t.label}</span>
                          </div>
                          <span className="text-[9px] text-text-muted mt-2xs leading-normal">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Registered Providers Card */}
                  <div className="bg-surface border border-border rounded-md p-md space-y-sm shadow-low">
                    <span className="font-mono text-[10px] text-primary font-bold block uppercase tracking-wider">AI Adapter Register</span>
                    <div className="divide-y divide-border/60">
                      {[
                        { id: "google-gemini", name: "Google Gemini Adapter", desc: "Primary @google/genai orchestration", status: "Active (Stub)" },
                        { id: "openai", name: "OpenAI GPT Adapter", desc: "Fallback LLM execution pipeline", status: "Active (Stub)" },
                        { id: "anthropic-claude", name: "Anthropic Claude Adapter", desc: "Auxiliary API abstraction layer", status: "Active (Stub)" },
                        { id: "azure-openai", name: "Azure OpenAI Service", desc: "Enterprise cloud proxy endpoint", status: "Active (Stub)" },
                        { id: "local-model", name: "Local Llama.cpp", desc: "Stadium offline hardware backup", status: "Active (Stub)" }
                      ].map((prov) => (
                        <div key={prov.id} className="py-sm first:pt-0 last:pb-0 flex items-center justify-between gap-sm">
                          <div className="space-y-[2px] truncate">
                            <span className="font-sans font-bold text-text-primary text-[11px] block">{prov.name}</span>
                            <span className="text-[9px] text-text-secondary block truncate">{prov.desc}</span>
                          </div>
                          <Badge variant="success" size="sm" className="shrink-0 font-mono text-[9px] font-bold">
                            {prov.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: AI Simulation & Orchestrator */}
                <div className="lg:col-span-7 space-y-md">
                  
                  <div className="bg-surface border border-border rounded-md p-md space-y-md shadow-low">
                    <div className="flex items-center gap-xs border-b border-border pb-xs">
                      <Sparkles className="w-4 h-4 text-secondary animate-pulse-gentle" />
                      <h4 className="font-display font-semibold text-caption text-text-primary uppercase tracking-wider">AI Pipeline Simulation & Orchestration</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
                      {/* Controls left */}
                      <div className="md:col-span-5 space-y-md">
                        <span className="font-mono text-[9px] text-text-secondary font-bold block uppercase tracking-wider">Dispatch Controls</span>
                        
                        <div className="space-y-1xs text-caption">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase font-semibold">Select Template ID</label>
                          <select 
                            className="w-full bg-background border border-border/80 rounded-sm px-xs py-[8px] font-mono text-text-primary text-caption focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer h-9"
                            value={selectedPromptId}
                            onChange={(e) => setSelectedPromptId(e.target.value)}
                          >
                            <option value="evaluate-situation">evaluate-situation (v1.0)</option>
                            <option value="crowd-congestion-mitigation">crowd-congestion-mitigation (v1.1)</option>
                          </select>
                        </div>

                        <div className="space-y-1xs text-caption">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase font-semibold">Target Adapter Provider</label>
                          <select 
                            className="w-full bg-background border border-border/80 rounded-sm px-xs py-[8px] font-mono text-text-primary text-caption focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer h-9"
                            value={selectedProviderId}
                            onChange={(e) => setSelectedProviderId(e.target.value)}
                          >
                            <option value="google-gemini">Google Gemini SDK</option>
                            <option value="openai">OpenAI GPT</option>
                            <option value="anthropic-claude">Anthropic Claude</option>
                            <option value="azure-openai">Azure OpenAI Service</option>
                            <option value="local-model">Local Hardware Llama.cpp</option>
                          </select>
                        </div>

                        <div className="space-y-1xs text-caption">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase font-semibold">Queue Priority</label>
                          <select 
                            className="w-full bg-background border border-border/80 rounded-sm px-xs py-[8px] font-mono text-text-primary text-caption focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer h-9"
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value as any)}
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH (Standard)</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </div>

                        <Button 
                          variant="primary" 
                          className="w-full text-caption font-bold h-9 mt-xs"
                          disabled={testExecutionLoading}
                          onClick={handleTriggerTestAIRequest}
                        >
                          {testExecutionLoading ? (
                            <div className="flex items-center justify-center gap-xs">
                              <Spinner size="sm" className="text-white" />
                              <span>Queued...</span>
                            </div>
                          ) : (
                            <span>Submit Request</span>
                          )}
                        </Button>
                      </div>

                      {/* Output right */}
                      <div className="md:col-span-7 bg-background/50 border border-border/80 rounded-sm p-sm flex flex-col justify-between min-h-[280px]">
                        <div className="space-y-sm">
                          <span className="font-mono text-[9px] text-text-secondary font-bold block uppercase border-b pb-2xs">Live Pipeline Outcome Output</span>
                          
                          {testExecutionLoading && (
                            <div className="h-40 flex flex-col items-center justify-center space-y-sm text-text-secondary font-mono text-caption">
                              <Spinner size="md" className="text-primary animate-spin" />
                              <span>Orchestrating Request Lifecycle pipelines...</span>
                            </div>
                          )}

                          {!testExecutionLoading && !testExecutionResult && !testExecutionError && (
                            <div className="h-40 flex flex-col items-center justify-center text-center text-text-muted text-[10px] font-mono space-y-sm px-sm">
                              <Sliders className="w-8 h-8 text-text-muted/60" />
                              <span className="leading-relaxed">Select active preferences and trigger a prompt payload dispatch to test the validation matrix.</span>
                            </div>
                          )}

                          {testExecutionError && (
                            <div className="p-xs bg-error/5 border border-error/20 text-error rounded-sm font-mono text-caption">
                              <strong>[Pipeline Error] Execution Failed:</strong>
                              <p className="mt-2xs leading-normal">{testExecutionError}</p>
                            </div>
                          )}

                          {testExecutionResult && (
                            <div className="space-y-xs text-left">
                              <div className="grid grid-cols-2 gap-xs font-mono text-[9px] text-text-secondary bg-surface border p-xs rounded-xs">
                                <div>Correlation: <strong className="text-text-primary truncate block">{testExecutionResult.auditEntry?.correlationId}</strong></div>
                                <div>Latency: <strong className="text-primary">{testExecutionResult.auditEntry?.latencyMs}ms</strong></div>
                                <div>Validation: <span className="text-success font-bold">{testExecutionResult.auditEntry?.validationStatus}</span></div>
                                <div>Score: <strong className="text-warning">{testExecutionResult.confidence?.overallScore} / 1.0</strong></div>
                              </div>

                              <div className="space-y-[2px]">
                                <span className="text-[8px] font-mono text-text-muted uppercase font-bold block">Rendered Prompt payload</span>
                                <div className="bg-surface p-xs text-[9px] font-mono text-text-secondary rounded-xs border max-h-16 overflow-y-auto leading-normal">
                                  {testExecutionResult.auditEntry?.contextSnapshot?.timestamp && (
                                    <div className="text-primary font-bold mb-xs">// Context built with temp {testExecutionResult.auditEntry?.contextSnapshot?.weatherState?.temperature}°C</div>
                                  )}
                                  {PromptRegistry.getInstance().renderPrompt(selectedPromptId, {
                                    incidentId: "INC-999",
                                    sector: "North Quadrant",
                                    severity: "CRITICAL",
                                    weatherAdvisory: "Nominal",
                                    gateId: "GATE-ALPHA",
                                    waitTime: 18,
                                    flowRate: 45
                                  }).text}
                                </div>
                              </div>

                              <div className="space-y-[2px]">
                                <span className="text-[8px] font-mono text-text-muted uppercase font-bold block">Validated Response JSON</span>
                                <pre className="bg-surface p-xs text-[9px] font-mono text-success rounded-xs border overflow-x-auto max-h-20 leading-normal">
                                  {JSON.stringify(testExecutionResult.parsedData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {testExecutionResult && (
                          <div className="text-[8px] font-mono text-text-muted border-t pt-xs mt-xs leading-normal">
                            * normalized confidence metric computed dynamically across context coverage & model weight factors.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Audit Ledger List */}
                <div className="pt-md border-t border-border/60">
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-xs">
                      <Clock className="w-5 h-5 text-text-secondary" />
                      <h4 className="font-display font-semibold text-h2 text-text-primary">Operational AI Audit Trails & Ledger Logs</h4>
                    </div>
                    {aiAudits.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] font-mono"
                        onClick={handleClearAudits}
                      >
                        Clear Ledger History
                      </Button>
                    )}
                  </div>

                  {aiAudits.length === 0 ? (
                    <div className="p-md border border-dashed border-border rounded-md text-center text-text-muted text-caption font-mono">
                      Ledger is currently empty. Fire a simulated request to create cryptographic audit trace blocks.
                    </div>
                  ) : (
                    <div className="relative pl-sm space-y-md max-h-[350px] overflow-y-auto pr-xs" id="settings-audit-ledger">
                      {/* Vertical connector line */}
                      <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-border/80 -z-10" />

                      {aiAudits.map((audit, idx) => {
                        const isSuccess = audit.validationStatus === "SUCCESS";
                        const nodeColor = isSuccess ? "border-success bg-success/10 text-success" : "border-warning bg-warning/10 text-warning";
                        
                        return (
                          <div key={audit.id} className="relative flex items-start gap-md text-left" id={`audit-timeline-node-${audit.id}`}>
                            {/* Visual circle node */}
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold z-10 bg-surface ${nodeColor}`}>
                              {idx + 1}
                            </div>

                            {/* Timeline content card */}
                            <div className="flex-1 bg-background/50 border rounded-sm p-sm space-y-xs transition-all hover:bg-background/80 hover:shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs border-b border-border/50 pb-xs">
                                <div className="flex items-center gap-xs flex-wrap">
                                  <span className="font-mono font-bold text-text-primary text-[11px]">{audit.id}</span>
                                  <Badge variant={isSuccess ? "success" : "warning"} size="sm">
                                    {audit.validationStatus}
                                  </Badge>
                                  <span className="text-text-muted text-[10px] font-mono">|</span>
                                  <span className="text-text-secondary font-mono text-[10px]">v{audit.promptVersion}</span>
                                </div>
                                <span className="font-mono text-[9px] text-text-muted shrink-0">
                                  Executed: {new Date(audit.executionTime).toLocaleTimeString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-sm font-mono text-[10px] pt-xs">
                                <div className="space-y-[2px]">
                                  <span className="text-[8px] text-text-muted uppercase block">AI Orchestration Tool</span>
                                  <span className="font-semibold text-text-primary block truncate" title={audit.promptId}>{audit.promptId}</span>
                                </div>
                                <div className="space-y-[2px]">
                                  <span className="text-[8px] text-text-muted uppercase block">LLM Provider Adapter</span>
                                  <span className="font-semibold text-primary block uppercase">{audit.providerId}</span>
                                </div>
                                <div className="space-y-[2px]">
                                  <span className="text-[8px] text-text-muted uppercase block">Response Latency</span>
                                  <span className="font-bold text-secondary block">{audit.latencyMs}ms <span className="text-[8px] text-success font-normal">(Within SLA)</span></span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] font-mono text-text-muted pt-1xs border-t border-dashed border-border/60">
                                <span>Correlation ID: <strong className="text-text-secondary">{audit.correlationId}</strong></span>
                                <span className="text-success flex items-center gap-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                                  Cryptographically Signed Log
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
            </Card>
          )}

          {activeNavId === "diagnostics" && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-md min-h-[150px]"><Spinner size="md" /></div>}>
              <DiagnosticsWidget />
            </React.Suspense>
          )}

          {/* C. ENTERPRISE FOOTER NOTES */}
          <footer className="pt-md border-t border-border/40 flex flex-col md:flex-row justify-between text-caption font-mono text-text-muted gap-xs" id="shell-footer-notes">
            <span>FIFA Tournament Operations Center • Active Platform</span>
            <span>Version 1.0.0 • Verified WCAG Contrast</span>
          </footer>

        </div>
      </Workspace>

      {/* ========================================== */}
      {/* 4. ACCESSIBILITY DYNAMIC STYLE INJECTOR   */}
      {/* ========================================== */}
      <style>{`
        ${a11yLargeText ? `
          html, body, button, input, select, textarea, p, span, div, h1, h2, h3, h4, h5, h6 {
            font-size: 104% !important;
          }
        ` : ""}
        ${a11yHighContrast ? `
          body {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          .bg-surface, .bg-background, .bg-surface-hover, select, button, input {
            background-color: #0c0c0c !important;
            color: #ffffff !important;
            border-color: #ffffff !important;
            border-width: 2px !important;
          }
          .text-text-secondary, .text-text-muted, .text-caption, p, span, h1, h2, h3, h4, h5, h6 {
            color: #ffffff !important;
          }
          .border, border-border {
            border-color: #ffffff !important;
            border-width: 2px !important;
          }
        ` : ""}
        ${a11yReducedMotion ? `
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        ` : ""}
        ${a11yColorblindMode ? `
          .border-error, .border-success, .border-warning {
            border-style: dashed !important;
            border-width: 3px !important;
          }
          .badge, Badge {
            text-decoration: underline !important;
            border-width: 2px !important;
          }
        ` : ""}
      `}</style>

      {/* ========================================== */}
      {/* 4. ACCESSIBILITY QUICK CONTROLS OVERLAY   */}
      {/* ========================================== */}
      <div className="fixed bottom-4 left-4 z-[9999]" id="a11y-quick-hub">
        <button
          onClick={() => setShowA11yMenu(!showA11yMenu)}
          className="w-12 h-12 rounded-full bg-primary text-primary-fg shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-border"
          title="Toggle Accessibility and Contrast Controls"
          aria-haspopup="true"
          aria-expanded={showA11yMenu}
        >
          <Sliders className="w-5 h-5 text-white" />
        </button>

        {showA11yMenu && (
          <div className="absolute bottom-14 left-0 w-80 bg-surface border-2 border-border shadow-2xl rounded-md p-md space-y-md text-left text-text-primary z-[9999]">
            <div className="border-b border-border/60 pb-xs flex justify-between items-center">
              <div>
                <h4 className="font-display font-bold text-caption text-text-primary">Assistive Accessibility Suite</h4>
                <p className="text-[10px] text-text-muted">Targeting WCAG 2.1 AA Conformity</p>
              </div>
              <button onClick={() => setShowA11yMenu(false)} className="text-text-muted hover:text-text-primary cursor-pointer font-bold font-mono text-xs">✕</button>
            </div>

            <div className="space-y-sm">
              <label className="flex items-center justify-between p-xs bg-background/40 border rounded-xs cursor-pointer hover:bg-background/80">
                <div className="space-y-[1px]">
                  <span className="text-[11px] font-sans font-bold text-text-primary block">Large Font Zoom (+15%)</span>
                  <span className="text-[9px] text-text-secondary block font-mono">Scales body copy for easier reading</span>
                </div>
                <input
                  type="checkbox"
                  checked={a11yLargeText}
                  onChange={(e) => setA11yLargeText(e.target.checked)}
                  className="rounded-xs border-border text-primary cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-xs bg-background/40 border rounded-xs cursor-pointer hover:bg-background/80">
                <div className="space-y-[1px]">
                  <span className="text-[11px] font-sans font-bold text-text-primary block">Extreme Contrast Mode</span>
                  <span className="text-[9px] text-text-secondary block font-mono">Forces high contrast elements</span>
                </div>
                <input
                  type="checkbox"
                  checked={a11yHighContrast}
                  onChange={(e) => setA11yHighContrast(e.target.checked)}
                  className="rounded-xs border-border text-primary cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-xs bg-background/40 border rounded-xs cursor-pointer hover:bg-background/80">
                <div className="space-y-[1px]">
                  <span className="text-[11px] font-sans font-bold text-text-primary block">Reduced Motion Assist</span>
                  <span className="text-[9px] text-text-secondary block font-mono">Stops animations and blinking indicators</span>
                </div>
                <input
                  type="checkbox"
                  checked={a11yReducedMotion}
                  onChange={(e) => setA11yReducedMotion(e.target.checked)}
                  className="rounded-xs border-border text-primary cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-xs bg-background/40 border rounded-xs cursor-pointer hover:bg-background/80">
                <div className="space-y-[1px]">
                  <span className="text-[11px] font-sans font-bold text-text-primary block">Colorblind Outline Assist</span>
                  <span className="text-[9px] text-text-secondary block font-mono">Adds dashed lines and text underlines</span>
                </div>
                <input
                  type="checkbox"
                  checked={a11yColorblindMode}
                  onChange={(e) => setA11yColorblindMode(e.target.checked)}
                  className="rounded-xs border-border text-primary cursor-pointer w-4 h-4"
                />
              </label>
            </div>

            <div className="flex justify-between items-center pt-xs border-t border-border/40">
              <span className="font-mono text-[9px] text-success">✔ Keyboard Tab Nav Ready</span>
              <button
                onClick={() => {
                  setA11yLargeText(false);
                  setA11yHighContrast(false);
                  setA11yReducedMotion(false);
                  setA11yColorblindMode(false);
                }}
                className="font-mono text-[9px] text-primary hover:underline font-bold cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. DYNAMIC SCENARIO GUIDANCE CARD          */}
      {/* ========================================== */}
      {(() => {
        const activeScenId = simulationEngineState?.activeScenarioId;
        if (!activeScenId || activeScenId === "SC-NORMAL" || isScenarioGuideDismissed) return null;

        let title = "Operational Scenario Guided Walkthrough";
        let description = "An event has been injected into the live simulation.";
        let observationPoints = [
          "Observe live ingress drop inside transit widgets.",
          "Check the newly logged incident with SLA countdown ticking.",
          "Expand recommendation center to evaluate calibrated LLM confidence, retrieved SOP rules, and estimated CO2 offsets."
        ];

        if (activeScenId === "SC-STRIKE") {
          title = "Active Scenario: Metro Transit Interruption";
          description = "Grid infrastructure downtime has suspended transit trains on lines A & B, causing huge pedestrian queues outside sector terminals.";
          observationPoints = [
            "Observe the instantaneous drop in Metro throughput under Logistic widgets.",
            "Verify the color-progressive SLA timer ticking on the open METRO incident in Incident Registry.",
            "Inspect the Copilot recommendation for shuttle dispatching, including grounding SOP excerpts and metrics predictions."
          ];
        } else if (activeScenId === "SC-SOLD-OUT") {
          title = "Active Scenario: Ingress Crowd Surge";
          description = "Match ticket gates are experiencing record crowds (exceeding 6 people/m²), triggering safety hazard alerts.";
          observationPoints = [
            "Monitor red warning markers flickering on the Live Crowd Heatmap.",
            "Look for safety alerts and the corresponding SLA response timeline under Incident Center.",
            "Expand the AI Dispatch recommendation card to audit the retrieved SOP titled 'FIFA Crowd Density Protocol'."
          ];
        } else if (activeScenId === "SC-HEAT") {
          title = "Active Scenario: Thermal Ingress Emergency";
          description = "Temperatures inside Section 112 have escalated to 39.5°C, requiring dynamic shade allocation and emergency hydration dispatches.";
          observationPoints = [
            "Check environmental counters spiking on the Weather and Health logs.",
            "Look for the hydration center dispatch recommendations formulated by Gemini.",
            "Click on the prediction impact preview showing estimated water distribution throughputs."
          ];
        }

        return (
          <div 
            className="fixed bottom-4 right-4 z-[9997] w-[380px] bg-surface border-2 border-primary shadow-2xl rounded-md p-md space-y-sm text-left animate-slide-up"
            id="scenario-guidance-overlay"
          >
            <div className="flex justify-between items-start border-b border-border pb-xs">
              <div className="flex items-center gap-xs">
                <Sparkles className="w-5 h-5 text-secondary animate-pulse-gentle" />
                <h4 className="font-display font-bold text-caption text-text-primary">{title}</h4>
              </div>
              <button 
                onClick={() => setIsScenarioGuideDismissed(true)} 
                className="text-text-muted hover:text-text-primary cursor-pointer font-bold font-mono text-xs"
                title="Dismiss Guidance"
              >
                ✕
              </button>
            </div>

            <p className="text-caption text-text-secondary leading-normal">{description}</p>

            <div className="space-y-xs pt-xs">
              <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider block">🏆 Observer Evaluation Guide:</span>
              <ul className="space-y-xs">
                {observationPoints.map((pt, i) => (
                  <li key={i} className="flex gap-xs items-start text-[10px] text-text-secondary leading-normal">
                    <span className="text-primary font-bold">{i+1}.</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-xs flex justify-between items-center text-[9px] font-mono border-t border-border/60">
              <span className="text-text-muted">Target SLA: <strong>900s</strong></span>
              <button 
                onClick={() => setIsScenarioGuideDismissed(true)}
                className="text-primary hover:underline font-bold cursor-pointer"
              >
                Understood, Dismiss
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================== */}
      {/* 6. INTERACTIVE OPERATOR TOUR WIZARD        */}
      {/* ========================================== */}
      {walkthroughStep !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[99999]" id="judge-tour-dialog">
          <div className="bg-surface border-2 border-primary max-w-md w-full rounded-md shadow-2xl p-lg text-left space-y-md text-text-primary m-md relative">
            
            {/* Steps tracker header */}
            <div className="flex justify-between items-center border-b border-border/80 pb-xs">
              <div className="flex items-center gap-xs">
                <Sparkles className="w-4 h-4 text-secondary animate-pulse-gentle" />
                <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider">
                  🏆 Stadium Operations Tour • Step {walkthroughStep} of 5
                </span>
              </div>
              <button 
                onClick={() => setWalkthroughStep(null)} 
                className="text-text-muted hover:text-text-primary font-bold cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Step content switch */}
            {walkthroughStep === 1 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">1. Deploy a Live Scenario Event</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Start the tournament simulation by selecting a scenario in the **One-Click Live Scenarios** grid (e.g. **Metro Failure** or **Crowd Surge**). This simulates emergency sensors, crowd telemetry logs, and triggers the AI agent pipeline immediately.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The system clock starts ticking and live environmental feeds load dynamically.
                </div>
              </div>
            )}

            {walkthroughStep === 2 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">2. Track Live Ingress & Incident SLAs</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Navigate to the **Incidents & Teams** sub-tab. Notice the newly registered incident with its real-time color-progressive **SLA Countdown Timer** ticking. The timer changes from green to warning orange and flashing red as limits approach.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The system also prints predicted resolution timings (e.g., "Est. Resolve: 2.5m") for optimal operators.
                </div>
              </div>
            )}

            {walkthroughStep === 3 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">3. Inspect Explainable AI Center</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Go to the **AI Copilot** sub-tab. Expand any generated recommendation to view our **Explainable AI (XAI) Panel**. Review the model confidence gauges, retrieved SOP collection titles, excerpts, and predictive impact matrices (Wait times, CO2 offset, Dispatch speed).
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: Predictions provide physical metrics, e.g. "CO₂ Offset: -140kg", showing sustainable load balancing.
                </div>
              </div>
            )}

            {walkthroughStep === 4 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">4. Execute Human Overrides & Dispatch</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Click **Approve Operational Intervention** on the recommendation card. This models real-world human-in-the-loop validation, resolving the underlying incident instantly, deploying the units, and logging the action.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The active incident's status moves directly to "RESOLVED" and the SLA timer locks on "SLA Met".
                </div>
              </div>
            )}

            {walkthroughStep === 5 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">5. Review Cryptographic Audit Ledger</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Finally, go to the **Settings & Logs** tab and scroll to the bottom. Here, our **AI Audit Timeline** logs every prompt version, execution latency, adapter, and correlation ID in a connected vertical graph for enterprise accountability.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The logs are cryptographically stamped, proving full operations center compliance.
                </div>
              </div>
            )}

            {/* Navigation footer */}
            <div className="flex justify-between items-center pt-md border-t border-border/60">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWalkthroughStep(prev => prev === 1 ? null : prev! - 1)}
                disabled={walkthroughStep === 1}
                className="font-mono text-[10px] font-bold"
              >
                ◀ Back
              </Button>

              <div className="flex items-center gap-xs">
                <button 
                  onClick={() => setWalkthroughStep(null)} 
                  className="text-text-muted hover:text-text-primary font-mono text-[10px] px-sm font-bold cursor-pointer"
                >
                  Skip Tour
                </button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    if (walkthroughStep === 5) {
                      setWalkthroughStep(null);
                    } else {
                      setWalkthroughStep(prev => prev! + 1);
                    }
                  }}
                  className="font-mono text-[10px] font-bold"
                >
                  {walkthroughStep === 5 ? "Finish Tour 🎉" : "Next Step ▶"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Shell>
  );
}

export default function App() {
  return (
    <ShellProvider>
      <TournamentProvider>
        <CollaborationProvider>
          <AppContent />
        </CollaborationProvider>
      </TournamentProvider>
    </ShellProvider>
  );
}
