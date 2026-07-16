/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  Incident, 
  IncidentStatus, 
  Severity, 
  IncidentCategory, 
  Gate, 
  CrowdZone, 
  Volunteer, 
  MedicalTeam, 
  SecurityTeam, 
  Resource, 
  AccessibilityResource, 
  Match, 
  TransportLine, 
  Weather, 
  Notification, 
  OperationalRecommendation, 
  DecisionState,
  SimulationScenario,
  SimulationEngineState,
  OperatorSession,
  StaffRole,
  EventCategory,
  EventType
} from "../types";

import { EventBus } from "../services/eventBus";

import { 
  incidentService, 
  crowdFlowService, 
  resourceService, 
  notificationService, 
  recommendationService, 
  simulationService 
} from "../services/mock";

import { SimulationEngine } from "../services/simulation/SimulationEngine";
import { mockDb } from "../repositories/mock";

export interface TournamentContextType {
  // 1. Operational State
  incidents: Incident[];
  gates: Gate[];
  crowdZones: CrowdZone[];
  volunteers: Volunteer[];
  medicalTeams: MedicalTeam[];
  securityTeams: SecurityTeam[];
  resources: Resource[];
  accessibilityResources: AccessibilityResource[];
  matches: Match[];
  transportLines: TransportLine[];
  weather: Weather | null;
  recommendations: OperationalRecommendation[];

  // 2. UI State
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedGateId: string | null;
  setSelectedGateId: (id: string | null) => void;
  selectedSector: string | null;
  setSelectedSector: (sector: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;

  // 3. Session State
  session: OperatorSession | null;
  setSession: (session: OperatorSession | null) => void;

  // 4. Simulation State
  simulationActive: boolean;
  simulationScenario: SimulationScenario | null;
  availableScenarios: SimulationScenario[];
  simulationEngineState: SimulationEngineState;

  // 5. Notification State
  notifications: Notification[];
  unreadNotificationCount: number;

  // 6. State Mutation Handlers
  reloadAllState: () => Promise<void>;
  createIncident: (params: {
    description: string;
    category: IncidentCategory;
    severity: Severity;
    sector: string;
    section: string;
    stadiumId: string;
  }) => Promise<Incident>;
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<Incident>;
  assignStaffToIncident: (id: string, staffIds: string[]) => Promise<Incident>;
  updateGateStatus: (id: string, status: Gate["status"]) => Promise<Gate>;
  resolveRecommendation: (id: string, decision: DecisionState) => Promise<OperationalRecommendation>;
  publishNotification: (title: string, message: string, category: Notification["category"], severity: Notification["severity"]) => Promise<Notification>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  startScenario: (scenarioId: string) => Promise<void>;
  stopScenario: () => Promise<void>;
  setSimulationPaused: (paused: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  resetSimulation: () => void;
}

const TournamentContext = React.createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE DECLARATIONS ---
  
  // 1. Operational State
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [crowdZones, setCrowdZones] = React.useState<CrowdZone[]>([]);
  const [volunteers, setVolunteers] = React.useState<Volunteer[]>([]);
  const [medicalTeams, setMedicalTeams] = React.useState<MedicalTeam[]>([]);
  const [securityTeams, setSecurityTeams] = React.useState<SecurityTeam[]>([]);
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [accessibilityResources, setAccessibilityResources] = React.useState<AccessibilityResource[]>([]);
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [transportLines, setTransportLines] = React.useState<TransportLine[]>([]);
  const [weather, setWeather] = React.useState<Weather | null>(null);
  const [recommendations, setRecommendations] = React.useState<OperationalRecommendation[]>([]);

  // 2. UI State
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<string | null>(null);
  const [selectedGateId, setSelectedGateId] = React.useState<string | null>(null);
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // 3. Session State
  const [session, setSession] = React.useState<OperatorSession | null>({
    token: "mock-session-token",
    expiresIn: 3600,
    user: {
      id: "OP-99",
      name: "Marcus Aurelius (TOC Lead)",
      role: StaffRole.TOC_OPERATOR,
      assignedSector: "Southwest Sector Command"
    }
  });

  // 4. Simulation State
  const [simulationActive, setSimulationActive] = React.useState<boolean>(false);
  const [simulationScenario, setSimulationScenario] = React.useState<SimulationScenario | null>(null);
  const [availableScenarios, setAvailableScenarios] = React.useState<SimulationScenario[]>([]);
  const [simulationEngineState, setSimulationEngineState] = React.useState<SimulationEngineState>(
    SimulationEngine.getInstance().getState()
  );

  // 5. Notification State
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // --- LOADER ---
  const reloadAllState = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load straight from db/services to ensure absolute consistency
      const [
        loadedIncidents,
        loadedGates,
        loadedZones,
        loadedVolunteers,
        loadedMedics,
        loadedSecurity,
        loadedResources,
        loadedAccess,
        loadedMatches,
        loadedTransport,
        loadedRecommendations,
        loadedNotifications,
        scenarios
      ] = await Promise.all([
        mockDb.incidents.getAll(),
        mockDb.gates.getAll(),
        mockDb.crowdZones.getAll(),
        mockDb.volunteers.getAll(),
        mockDb.medicalTeams.getAll(),
        mockDb.securityTeams.getAll(),
        mockDb.resources.getAll(),
        mockDb.accessibility.getAll(),
        mockDb.matches.getAll(),
        mockDb.transport.getAll(),
        recommendationService.getRecommendations(),
        notificationService.getNotifications(),
        simulationService.getScenarios()
      ]);

      setIncidents(loadedIncidents);
      setGates(loadedGates);
      setCrowdZones(loadedZones);
      setVolunteers(loadedVolunteers);
      setMedicalTeams(loadedMedics);
      setSecurityTeams(loadedSecurity);
      setResources(loadedResources);
      setAccessibilityResources(loadedAccess);
      setMatches(loadedMatches);
      setTransportLines(loadedTransport);

      const engine = SimulationEngine.getInstance();
      const currentEngineState = engine.getState();
      setSimulationEngineState(currentEngineState);

      const activeScenId = currentEngineState.activeScenarioId;
      const isRain = activeScenId === "SC-RAIN";
      const isHeat = activeScenId === "SC-HEAT";

      const weatherData = {
        temperature: isHeat ? 39 : isRain ? 21 : 28,
        condition: isRain ? "Rainy" : "Clear",
        windSpeed: isRain ? 25 : 12,
        humidity: isRain ? 90 : isHeat ? 65 : 45,
        advisory: isRain 
          ? "Heavy rain warning; spectator entry slowed by wet screenings; transit speeds reduced."
          : isHeat 
          ? "Extreme summer heat warning; spectator hydration protocols active; medical patrols on high alert."
          : "Nominal weather conditions; stadium climate conditioning systems active.",
        lastUpdatedAt: currentEngineState.simulationTime
      };

      setWeather(weatherData);

      EventBus.getInstance().publish(
        EventType.WeatherUpdated,
        EventCategory.OPERATIONAL,
        { weather: weatherData },
        "SIMULATION_ENGINE"
      );

      setRecommendations(loadedRecommendations);
      setNotifications(loadedNotifications);
      setAvailableScenarios(scenarios);
    } catch (err) {
      console.error("Failed to load operational state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state on mount
  React.useEffect(() => {
    reloadAllState();
  }, [reloadAllState]);

  // Demonstrate Event Bus subscriptions
  React.useEffect(() => {
    const eventBus = EventBus.getInstance();

    const subCreated = eventBus.subscribe(EventType.IncidentCreated, (event) => {
      console.log(`[EventBus] Subscriber received ${event.type}:`, event.payload);
    });

    const subResolved = eventBus.subscribe(EventType.IncidentResolved, (event) => {
      console.log(`[EventBus] Subscriber received ${event.type}:`, event.payload);
    });

    const subPaused = eventBus.subscribe(EventType.SimulationPaused, (event) => {
      console.log(`[EventBus] Subscriber received ${event.type}:`, event.payload);
    });

    const subResumed = eventBus.subscribe(EventType.SimulationResumed, (event) => {
      console.log(`[EventBus] Subscriber received ${event.type}:`, event.payload);
    });

    return () => {
      subCreated.unsubscribe();
      subResolved.unsubscribe();
      subPaused.unsubscribe();
      subResumed.unsubscribe();
    };
  }, []);

  // Simulation tick loop if scenario is active
  React.useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(async () => {
      try {
        const engineState = SimulationEngine.getInstance().getState();
        if (!engineState.isPaused) {
          await simulationService.tickSimulation();
          await reloadAllState();
        }
      } catch (e) {
        console.error("Simulation tick error", e);
      }
    }, 4000); // 4-second responsive loops

    return () => clearInterval(interval);
  }, [simulationActive, reloadAllState]);

  // --- ACTIONS ---

  const createIncident = async (params: {
    description: string;
    category: IncidentCategory;
    severity: Severity;
    sector: string;
    section: string;
    stadiumId: string;
  }) => {
    const created = await incidentService.createIncident(params);
    
    EventBus.getInstance().publish(
      EventType.IncidentCreated,
      EventCategory.OPERATIONAL,
      { incident: created },
      session?.user.id || "TOC_OPERATOR",
      created.severity === Severity.CRITICAL ? "CRITICAL" : "HIGH"
    );

    await reloadAllState();
    return created;
  };

  const updateIncidentStatus = async (id: string, status: IncidentStatus) => {
    const updated = await incidentService.updateIncidentStatus(id, status);
    
    if (status === IncidentStatus.RESOLVED) {
      EventBus.getInstance().publish(
        EventType.IncidentResolved,
        EventCategory.OPERATIONAL,
        { incidentId: id, resolvedAt: new Date().toISOString(), status: "RESOLVED" },
        session?.user.id || "TOC_OPERATOR",
        "HIGH"
      );
    }

    await reloadAllState();
    return updated;
  };

  const assignStaffToIncident = async (id: string, staffIds: string[]) => {
    const updated = await incidentService.assignStaffToIncident(id, staffIds);
    
    staffIds.forEach(volunteerId => {
      EventBus.getInstance().publish(
        EventType.VolunteerAssigned,
        EventCategory.OPERATIONAL,
        { incidentId: id, volunteerId, role: "STAFF" },
        session?.user.id || "TOC_OPERATOR",
        "MEDIUM"
      );
    });

    await reloadAllState();
    return updated;
  };

  const updateGateStatus = async (id: string, status: Gate["status"]) => {
    const updated = await crowdFlowService.updateGateStatus(id, status);
    await reloadAllState();
    return updated;
  };

  const resolveRecommendation = async (id: string, decision: DecisionState) => {
    const updated = await recommendationService.processDecision(id, decision, session?.user.id || "UNKNOWN_OPERATOR");
    
    if (decision === DecisionState.APPROVED) {
      EventBus.getInstance().publish(
        EventType.RecommendationApproved,
        EventCategory.AI,
        { recommendationId: id, approvedAt: new Date().toISOString() },
        session?.user.id || "TOC_OPERATOR",
        "HIGH"
      );
    } else if (decision === DecisionState.REJECTED) {
      EventBus.getInstance().publish(
        EventType.RecommendationRejected,
        EventCategory.AI,
        { recommendationId: id, rejectedAt: new Date().toISOString() },
        session?.user.id || "TOC_OPERATOR",
        "MEDIUM"
      );
    }

    await reloadAllState();
    return updated;
  };

  const publishNotification = async (title: string, message: string, category: Notification["category"], severity: Notification["severity"]) => {
    const created = await notificationService.publishNotification(title, message, category, severity);
    await reloadAllState();
    return created;
  };

  const markNotificationAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await reloadAllState();
  };

  const markAllNotificationsRead = async () => {
    await notificationService.markAllRead();
    await reloadAllState();
  };

  const startScenario = async (scenarioId: string) => {
    const active = await simulationService.startScenario(scenarioId);
    setSimulationScenario(active);
    setSimulationActive(true);
    SimulationEngine.getInstance().resume();
    await reloadAllState();
  };

  const stopScenario = async () => {
    await simulationService.stopActiveScenario();
    setSimulationScenario(null);
    setSimulationActive(false);
    await reloadAllState();
  };

  const setSimulationPaused = (paused: boolean) => {
    const engine = SimulationEngine.getInstance();
    if (paused) {
      engine.pause();
    } else {
      engine.resume();
    }
    reloadAllState();
  };

  const setSimulationSpeed = (speed: number) => {
    SimulationEngine.getInstance().setSpeed(speed);
    reloadAllState();
  };

  const resetSimulation = () => {
    SimulationEngine.getInstance().reset();
    reloadAllState();
  };

  const unreadNotificationCount = React.useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const value = React.useMemo(() => ({
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
    session,
    setSession,
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
  }), [
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
    selectedGateId,
    selectedSector,
    searchQuery,
    isLoading,
    session,
    simulationActive,
    simulationScenario,
    availableScenarios,
    simulationEngineState,
    notifications,
    unreadNotificationCount,
    reloadAllState
  ]);

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = React.useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};
