const fs = require('fs');

function createPage(name, blockFile, imports, extraProps = '') {
  const blockContent = fs.readFileSync(blockFile, 'utf8');
  // Strip the wrapper {activeNavId === "..." && ( ... )}
  let innerContent = blockContent.replace(/^{activeNavId === "[a-z]+" && \(\s*/, '').replace(/\s*\)\}$/, '');

  const fileContent = `
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
${imports}

export function ${name}(${extraProps ? `{ ${extraProps} }: any` : 'props: any'}) {
  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();

  const {
    incidents, gates, crowdZones, volunteers, medicalTeams, securityTeams, resources, accessibilityResources, matches, transportLines, weather, recommendations, selectedIncidentId, setSelectedIncidentId, selectedGateId, setSelectedGateId, selectedSector, setSelectedSector, searchQuery, setSearchQuery, isLoading, simulationActive, simulationScenario, availableScenarios, simulationEngineState, notifications, unreadNotificationCount, reloadAllState, createIncident, updateIncidentStatus, assignStaffToIncident, updateGateStatus, resolveRecommendation, publishNotification, markNotificationAsRead, markAllNotificationsRead, startScenario, stopScenario, setSimulationPaused, setSimulationSpeed, resetSimulation
  } = useTournament();

  const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  return (
    ${innerContent}
  );
}
`;
  fs.writeFileSync(`src/pages/${name}.tsx`, fileContent.trim());
}

// Ensure pages dir
if (!fs.existsSync('src/pages')) {
  fs.mkdirSync('src/pages');
}

// 1. Dashboard
createPage('DashboardView', 'block-dashboard.tsx', `
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
`, 'formatSimTime, setWalkthroughStep, selectedScenarioId, setSelectedScenarioId');

// 2. Incidents
createPage('IncidentsView', 'block-incidents.tsx', `
import { IncidentOperationsWidget } from "../components/dashboard/IncidentOperationsWidget";
import { HumanWorkflowWidget } from "../components/dashboard/HumanWorkflowWidget";
`, 'newIncDesc, setNewIncDesc, newIncCategory, setNewIncCategory, newIncSeverity, setNewIncSeverity, newIncSector, setNewIncSector, newIncSection, setNewIncSection, newIncSuccessMsg, handleCreateIncidentSubmit');

// 3. Map
createPage('MapView', 'block-map.tsx', `
import { ResourceWidget } from "../components/dashboard/ResourceWidget";
`, '');

// 4. Telemetry
createPage('TelemetryView', 'block-telemetry.tsx', `
import { TransportationWidget } from "../components/dashboard/TransportationWidget";
import { SustainabilityWidget } from "../components/dashboard/SustainabilityWidget";
import { AnalyticsWidget } from "../components/dashboard/AnalyticsWidget";
`, '');

// 5. Settings
createPage('SettingsView', 'block-settings.tsx', `
`, 'a11yLargeText, setA11yLargeText, a11yHighContrast, setA11yHighContrast, a11yReducedMotion, setA11yReducedMotion, a11yColorblindMode, setA11yColorblindMode, aiAudits, handleClearAudits, selectedPromptId, setSelectedPromptId, selectedProviderId, setSelectedProviderId, selectedPriority, setSelectedPriority, testExecutionLoading, testExecutionResult, testExecutionError, handleTriggerTestAIRequest');

// 6. Diagnostics
createPage('DiagnosticsView', 'block-diagnostics.tsx', `
import { DiagnosticsWidget } from "../components/dashboard/DiagnosticsWidget";
`, '');

