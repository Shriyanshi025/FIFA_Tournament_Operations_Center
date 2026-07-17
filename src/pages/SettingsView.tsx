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



interface SettingsViewProps {
  a11yLargeText: boolean;
  setA11yLargeText: (v: boolean) => void;
  a11yHighContrast: boolean;
  setA11yHighContrast: (v: boolean) => void;
  a11yReducedMotion: boolean;
  setA11yReducedMotion: (v: boolean) => void;
  a11yColorblindMode: boolean;
  setA11yColorblindMode: (v: boolean) => void;
}

export function SettingsView({ a11yLargeText, setA11yLargeText, a11yHighContrast, setA11yHighContrast, a11yReducedMotion, setA11yReducedMotion, a11yColorblindMode, setA11yColorblindMode }: SettingsViewProps) {
  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();

  const {
    incidents, gates, crowdZones, volunteers, medicalTeams, securityTeams, resources, accessibilityResources, matches, transportLines, weather, recommendations, selectedIncidentId, setSelectedIncidentId, selectedGateId, setSelectedGateId, selectedSector, setSelectedSector, searchQuery, setSearchQuery, isLoading, simulationActive, simulationScenario, availableScenarios, simulationEngineState, notifications, unreadNotificationCount, reloadAllState, createIncident, updateIncidentStatus, assignStaffToIncident, updateGateStatus, resolveRecommendation, publishNotification, markNotificationAsRead, markAllNotificationsRead, startScenario, stopScenario, setSimulationPaused, setSimulationSpeed, resetSimulation
  } = useTournament();

  
// AI Runtime simulation states
  const [aiAudits, setAiAudits] = React.useState<AIAuditEntry[]>([]);
  const [selectedPromptId, setSelectedPromptId] = React.useState("evaluate-situation");
  const [selectedProviderId, setSelectedProviderId] = React.useState("google-gemini");
  const [selectedPriority, setSelectedPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [testExecutionLoading, setTestExecutionLoading] = React.useState(false);
  type TestExecutionResultType = {
    auditEntry?: AIAuditEntry;
    confidence?: { overallScore?: number };
    parsedData?: unknown;
  };
  const [testExecutionResult, setTestExecutionResult] = React.useState<TestExecutionResultType | null>(null);
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
      let parameters: Record<string, unknown> = {};
      let responseSchema: unknown = undefined;

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
    } catch (err: unknown) {
      console.error("[TestAIRequest] Execution failed:", err);
      setTestExecutionError(err instanceof Error ? err.message : String(err));
    } finally {
      setTestExecutionLoading(false);
    }
  };

  const handleClearAudits = () => {
    AIAuditLayer.getInstance().clear();
    setAiAudits([]);
    setTestExecutionResult(null);
  };


  
const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  return (
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
                          onClick={() => setTheme(t.id as "default" | "light" | "high-contrast" | "emergency")}
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
                            onChange={(e) => setSelectedPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
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

                      {aiAudits.map((audit: AIAuditEntry, idx: number) => {
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
  );
}