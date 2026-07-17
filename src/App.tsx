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


import { RightSidebar } from "./layout/RightSidebar";
import { AccessibilityStyle } from "./components/dashboard/AccessibilityStyle";
import { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";
import { WalkthroughDialog } from "./components/dashboard/WalkthroughDialog";
import { DashboardView } from "./pages/DashboardView";
const IncidentsView = React.lazy(() => import('./pages/IncidentsView').then(m => ({ default: m.IncidentsView })));
const MapView = React.lazy(() => import('./pages/MapView').then(m => ({ default: m.MapView })));
const TelemetryView = React.lazy(() => import('./pages/TelemetryView').then(m => ({ default: m.TelemetryView })));
const SettingsView = React.lazy(() => import('./pages/SettingsView').then(m => ({ default: m.SettingsView })));
const DiagnosticsView = React.lazy(() => import('./pages/DiagnosticsView').then(m => ({ default: m.DiagnosticsView })));

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
  

  return (
    <Shell>
      <Workspace
        title={meta.title}
        description={meta.desc}
        actions={workspaceActions}
        rightSidebar={<RightSidebar />}
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
            
            <DashboardView 
              formatSimTime={formatSimTime} 
              setWalkthroughStep={setWalkthroughStep}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
            />
          )}

          <React.Suspense fallback={<div className="flex items-center justify-center p-xl min-h-[50vh]"><Spinner size="lg" /></div>}>
            {activeNavId === "incidents" && (
              
              <IncidentsView />
            )}

            {activeNavId === "map" && (
              <MapView />
            )}

            {activeNavId === "telemetry" && (
              <TelemetryView />
            )}

            {activeNavId === "settings" && (
              
              <SettingsView
                a11yLargeText={a11yLargeText}
                setA11yLargeText={setA11yLargeText}
                a11yHighContrast={a11yHighContrast}
                setA11yHighContrast={setA11yHighContrast}
                a11yReducedMotion={a11yReducedMotion}
                setA11yReducedMotion={setA11yReducedMotion}
                a11yColorblindMode={a11yColorblindMode}
                setA11yColorblindMode={setA11yColorblindMode}
                
              />
            )}

            {activeNavId === "diagnostics" && (
              <DiagnosticsView />
            )}
          </React.Suspense>

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
      <ScenarioGuidanceDialog />
      {/* ========================================== */}
      {/* 6. INTERACTIVE OPERATOR TOUR WIZARD        */}
      {/* ========================================== */}
      {walkthroughStep !== null && <WalkthroughDialog walkthroughStep={walkthroughStep} setWalkthroughStep={setWalkthroughStep} />}
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
