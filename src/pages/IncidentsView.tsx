import * as React from "react";
import { 
  Settings2, HelpCircle, Layout, Activity, AlertOctagon, Map, UserCheck, RefreshCw, Globe, Calendar, Users, TrendingUp, Train, Clock, HeartPulse, CloudSun, AlertTriangle, Play, Pause, RotateCcw, Gauge, CheckCircle2, XCircle, TrendingDown, ShieldAlert, Sliders, Send, Sparkles, MapPin, Flame, Thermometer, CloudRain, Compass
} from "lucide-react";
import { MatchStatus, DecisionState, ActionPriority, IncidentCategory, Severity, IncidentStatus } from "../types";
import { AIRequestManager, AIAuditLayer, PromptRegistry, AIAuditEntry } from "../services/aiRuntime";
import { useShell } from "../layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Alert, Input, Spinner } from "../components";
import { useTournament } from "../context/TournamentContext";
import { useCollaboration } from "../context/CollaborationContext";

import { IncidentOperationsWidget } from "../components/dashboard/IncidentOperationsWidget";
import { HumanWorkflowWidget } from "../components/dashboard/HumanWorkflowWidget";


export function IncidentsView() {
  
  // Incident creation state
  const [newIncDesc, setNewIncDesc] = React.useState("");
  const [newIncCategory, setNewIncCategory] = React.useState("CROWD");
  const [newIncSeverity, setNewIncSeverity] = React.useState("WARNING");
  const [newIncSector, setNewIncSector] = React.useState("Southwest Sector");
  const [newIncSection, setNewIncSection] = React.useState("Gate G-4");
  const [newIncSuccessMsg, setNewIncSuccessMsg] = React.useState("");

  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncDesc.trim()) return;

    try {
      await createIncident({
        description: newIncDesc,
        category: newIncCategory as IncidentCategory,
        severity: newIncSeverity as Severity,
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


  

  const { 
    activeNavId, setActiveNavId, theme, setTheme, preferences, setPreferences, currentVenue, setCurrentVenue, currentMatch, setCurrentMatch, isJudgeMode, setIsJudgeMode
  } = useShell();

  const {
    incidents, gates, crowdZones, volunteers, medicalTeams, securityTeams, resources, accessibilityResources, matches, transportLines, weather, recommendations, selectedIncidentId, setSelectedIncidentId, selectedGateId, setSelectedGateId, selectedSector, setSelectedSector, searchQuery, setSearchQuery, isLoading, simulationActive, simulationScenario, availableScenarios, simulationEngineState, notifications, unreadNotificationCount, reloadAllState, createIncident, updateIncidentStatus, assignStaffToIncident, updateGateStatus, resolveRecommendation, publishNotification, markNotificationAsRead, markAllNotificationsRead, startScenario, stopScenario, setSimulationPaused, setSimulationSpeed, resetSimulation
  } = useTournament();

  const { currentTab: dashTab, setCurrentTab: setDashTab } = useCollaboration();

  return (
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
                                    onClick={() => updateIncidentStatus(inc.id, IncidentStatus.RESOLVED)}
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
  );
}