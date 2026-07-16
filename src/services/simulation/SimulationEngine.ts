/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockDb } from "../../repositories/mock";
import { EventBus } from "../eventBus";
import { telemetry } from "../observability";
import { 
  SimulationEngineState, 
  SimulationEvent, 
  SimulationScenario,
  Incident,
  Notification,
  OperationalRecommendation,
  Severity,
  IncidentStatus,
  IncidentCategory,
  MatchStatus,
  DecisionState,
  ActionPriority,
  EventCategory,
  EventType
} from "../../types";

export const SCENARIO_DEFINITIONS: Omit<SimulationScenario, "isActive">[] = [
  {
    id: "SC-NORMAL",
    name: "Normal Match Day Loop",
    description: "Standard match operations with steady spectator ingress, nominal transit, and clear weather. Minimal incidents.",
    type: "NORMAL_MATCH"
  },
  {
    id: "SC-RAIN",
    name: "Heavy Rain Ingress Delay",
    description: "Sudden heavy rainfall slows ticket scanning due to rain hoods. Triggers a concession leak and transit delays.",
    type: "HEAVY_RAIN"
  },
  {
    id: "SC-HIGH-RISK",
    name: "High-Risk Rivalry Match",
    description: "High-friction match requiring strict security screenings. Triggers supporter friction and rapid responder dispatch.",
    type: "HIGH_RISK_MATCH"
  },
  {
    id: "SC-SOLD-OUT",
    name: "Sold Out Attendance Peak",
    description: "Stadium operating at maximum capacity (88,966). Triggers critical gate queues and turnstile redistribution protocols.",
    type: "SOLD_OUT_MATCH"
  },
  {
    id: "SC-VIP",
    name: "VIP/State Dignitary Visit",
    description: "Arrival of diplomatic motorcade during ingress. Triggers tight security sweeps and protocol staff routing.",
    type: "VIP_VISIT"
  },
  {
    id: "SC-STRIKE",
    name: "Metro Transit Strike",
    description: "Sudden suspension of Metro Line 2. Forces peak spectator loads onto shuttle buses, creating huge southwest hub bottlenecks.",
    type: "TRANSPORT_STRIKE"
  },
  {
    id: "SC-HEAT",
    name: "Extreme Heat & Medical Surge",
    description: "Ambient temperatures reach 39°C. Triggers multiple heat exhaustion cases in concourses and resource depleting.",
    type: "MEDICAL_SURGE"
  },
  {
    id: "SC-EVAC",
    name: "Emergency Stadium Evacuation",
    description: "Critical facilities fire hazard. Forces immediate suspension of the match and triggers rapid, coordinated emergency egress.",
    type: "EMERGENCY_EVACUATION"
  },
  {
    id: "SC-SHOOTOUT",
    name: "Penalty Shootout Thriller",
    description: "Match is tied at full-time. Extends match duration and delays egress, maintaining intense crowd density and high tension.",
    type: "PENALTY_SHOOTOUT"
  },
  {
    id: "SC-POWER",
    name: "Critical Power Grid Failure",
    description: "Substation overload cuts main stadium feed. Activates backup diesel generators and triggers safety protocols.",
    type: "POWER_FAILURE"
  },
  {
    id: "SC-ACCESS",
    name: "Para-Athletes Delegation Access",
    description: "High-volume wheelchair/mobility-impaired group arrival. Triggers high-capacity accessible transit and priority screenings.",
    type: "ACCESSIBILITY_REQUEST"
  }
];

export class SimulationEngine {
  private static instance: SimulationEngine | null = null;
  private state: SimulationEngineState;

  private constructor() {
    this.state = this.getDefaultState();
  }

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  private getDefaultState(): SimulationEngineState {
    return {
      currentStage: "Pregame",
      simulationTime: "2026-07-10T17:00:00Z", // Virtual timeline (Starts 2 hours before 19:00 kickoff)
      speedMultiplier: 1,
      isPaused: true,
      activeScenarioId: "SC-NORMAL",
      history: [],
      activeEvents: [],
      tickCount: 0
    };
  }

  public getState(): SimulationEngineState {
    return { ...this.state };
  }

  public pause(): void {
    this.state.isPaused = true;
    EventBus.getInstance().publish(
      EventType.SimulationPaused,
      EventCategory.SIMULATION,
      { pausedAt: this.state.simulationTime, reason: "Manual Pause" },
      "SIMULATION_ENGINE",
      "LOW"
    );
  }

  public resume(): void {
    this.state.isPaused = false;
    EventBus.getInstance().publish(
      EventType.SimulationResumed,
      EventCategory.SIMULATION,
      { resumedAt: this.state.simulationTime },
      "SIMULATION_ENGINE",
      "LOW"
    );
  }

  public setSpeed(speed: number): void {
    this.state.speedMultiplier = speed;
  }

  public reset(): void {
    this.state = this.getDefaultState();
    mockDb.resetAll();
    EventBus.getInstance().publish(
      EventType.SimulationReset,
      EventCategory.SIMULATION,
      { resetTime: this.state.simulationTime },
      "SIMULATION_ENGINE",
      "LOW"
    );
  }

  public loadScenario(scenarioId: string): void {
    this.reset();
    this.state.activeScenarioId = scenarioId;
    this.state.isPaused = false;
    
    const sc = SCENARIO_DEFINITIONS.find(s => s.id === scenarioId);
    if (sc) {
      this.publishNotification(
        `Scenario Loaded: ${sc.name}`,
        `Operational parameters calibrated for scenario: ${sc.description}`,
        "SYSTEM",
        "INFO"
      );
    }
  }

  public replay(recordedEvents: SimulationEvent[]): void {
    this.reset();
    this.state.history = [];
    this.state.activeEvents = [];
    this.state.isPaused = false;
    
    this.publishNotification(
      "Replay Initiated",
      "Running step-by-step playback of historical incident recordings.",
      "SYSTEM",
      "WARNING"
    );
  }

  // CORE TICK METHOD
  public async tick(): Promise<{
    incidentsTriggered: Incident[];
    notificationsTriggered: Notification[];
    recommendationsTriggered: OperationalRecommendation[];
  }> {
    const endMeasure = telemetry.startTimer("dashboard_render"); // Map tick cycles to dashboard evaluation render stats
    
    if (this.state.isPaused) {
      telemetry.reportComponentStatus("SimulationEngine", "OK", 1, "Simulation is currently paused.");
      return { incidentsTriggered: [], notificationsTriggered: [], recommendationsTriggered: [] };
    }

    const incidentsTriggered: Incident[] = [];
    const notificationsTriggered: Notification[] = [];
    const recommendationsTriggered: OperationalRecommendation[] = [];

    // 1. Advance Tick Count and Simulation Clock
    this.state.tickCount += 1;
    const currentTime = new Date(this.state.simulationTime);
    // Add (speedMultiplier * 2) minutes of virtual time per 5-second physical tick to keep it engaging
    const minsToAdd = this.state.speedMultiplier * 2;
    currentTime.setMinutes(currentTime.setMinutes(currentTime.getMinutes() + minsToAdd));
    this.state.simulationTime = currentTime.toISOString();

    // 2. Determine Current Stage (Kickoff is hardcoded at 19:00:00Z)
    const kickoffTime = new Date("2026-07-10T19:00:00Z");
    const diffMs = currentTime.getTime() - kickoffTime.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));

    let prevStage = this.state.currentStage;
    let nextStage: SimulationEngineState["currentStage"] = "Pregame";

    if (diffMins < -60) {
      nextStage = "Pregame";
    } else if (diffMins >= -60 && diffMins < 0) {
      nextStage = "Ingress";
    } else if (diffMins >= 0 && diffMins < 45) {
      nextStage = "Kickoff";
    } else if (diffMins >= 45 && diffMins < 60) {
      nextStage = "Halftime";
    } else if (diffMins >= 60 && diffMins < 105) {
      nextStage = "Second Half";
    } else if (diffMins >= 105 && diffMins < 120) {
      nextStage = "Final Whistle";
    } else if (diffMins >= 120 && diffMins < 180) {
      nextStage = "Egress";
    } else {
      nextStage = "Closed";
    }

    // Override stages if Emergency Evacuation is active and triggered
    const isEvacuating = this.state.activeScenarioId === "SC-EVAC" && diffMins >= -15;
    if (isEvacuating) {
      nextStage = "Egress";
    }

    this.state.currentStage = nextStage;

    if (nextStage !== prevStage) {
      const stageNotification = await this.publishNotification(
        `Operations Stage Transition: ${nextStage}`,
        `Stadium systems adjusted to align with ${nextStage} protocols.`,
        "FLOW",
        "INFO"
      );
      notificationsTriggered.push(stageNotification);
    }

    // 3. Update Match State
    const match = await mockDb.matches.getById("M-42");
    if (match) {
      let updatedStatus = match.status;
      let currentMin = match.currentMinute;
      let homeScore = match.scoreHome || 2;
      let awayScore = match.scoreAway || 2;
      let currentAttendance = match.attendance || 0;

      if (nextStage === "Pregame") {
        updatedStatus = MatchStatus.PRE_MATCH;
        currentMin = 0;
        currentAttendance = 0;
      } else if (nextStage === "Ingress") {
        updatedStatus = MatchStatus.PRE_MATCH;
        currentMin = 0;
        // Attendance fills up gradually
        const maxCap = this.state.activeScenarioId === "SC-SOLD-OUT" ? 88966 : 84200;
        const progress = (diffMins + 60) / 60; // 0 to 1
        currentAttendance = Math.floor(progress * maxCap * 0.95);
      } else if (nextStage === "Kickoff") {
        updatedStatus = MatchStatus.LIVE;
        currentMin = Math.min(diffMins, 45);
        currentAttendance = this.state.activeScenarioId === "SC-SOLD-OUT" ? 88966 : 84200;
        // Simulate a goal chance
        if (diffMins === 23 && this.state.tickCount % 2 === 0) {
          homeScore += 1;
          const goalNotification = await this.publishNotification(
            "GOAL! France Scores!",
            `Didier Griezmann scores at minute 23! Score: France ${homeScore} - ${awayScore} Argentina.`,
            "SYSTEM",
            "INFO"
          );
          notificationsTriggered.push(goalNotification);
        }
      } else if (nextStage === "Halftime") {
        updatedStatus = MatchStatus.LIVE;
        currentMin = 45;
      } else if (nextStage === "Second Half") {
        updatedStatus = MatchStatus.LIVE;
        currentMin = Math.min(45 + (diffMins - 60), 90);
        // Simulate Argentina goal chance
        if (diffMins === 72 && this.state.tickCount % 2 === 0) {
          awayScore += 1;
          const goalNotification = await this.publishNotification(
            "GOAL! Argentina Scores!",
            `Lionel Alvarez scores at minute 72! Score: France ${homeScore} - ${awayScore} Argentina.`,
            "SYSTEM",
            "INFO"
          );
          notificationsTriggered.push(goalNotification);
        }
      } else if (nextStage === "Final Whistle") {
        updatedStatus = MatchStatus.POST_MATCH;
        currentMin = 90;
      } else if (nextStage === "Egress") {
        updatedStatus = MatchStatus.POST_MATCH;
        // Attendance leaves gradually
        const maxCap = this.state.activeScenarioId === "SC-SOLD-OUT" ? 88966 : 84200;
        const leaveProgress = Math.max(0, 1 - (diffMins - 120) / 60); // 1 to 0
        currentAttendance = Math.floor(leaveProgress * maxCap);
      } else {
        updatedStatus = MatchStatus.DORMANT;
        currentMin = 0;
        currentAttendance = 0;
      }

      // Penalty shootout override score/state
      if (this.state.activeScenarioId === "SC-SHOOTOUT" && diffMins >= 90) {
        currentMin = 120; // Extra time
        if (diffMins >= 105) {
          homeScore = 3;
          awayScore = 3;
          if (diffMins === 115) {
            homeScore = 4; // Penalty shootout result
            const pGoal = await this.publishNotification(
              "PENALTY SHOOTOUT RESOLVED",
              `France wins 4-3 on penalties after an intense shootout block!`,
              "SYSTEM",
              "INFO"
            );
            notificationsTriggered.push(pGoal);
          }
        }
      }

      const oldStatus = match.status;
      await mockDb.matches.update("M-42", {
        status: updatedStatus,
        currentMinute: currentMin,
        scoreHome: homeScore,
        scoreAway: awayScore,
        attendance: currentAttendance
      });
      const updatedMatch = await mockDb.matches.getById("M-42");
      if (updatedMatch && oldStatus !== updatedStatus) {
        if (updatedStatus === MatchStatus.LIVE) {
          EventBus.getInstance().publish(
            EventType.MatchStarted,
            EventCategory.OPERATIONAL,
            { match: updatedMatch, timestamp: this.state.simulationTime },
            "SIMULATION_ENGINE",
            "HIGH"
          );
        } else if (updatedStatus === MatchStatus.POST_MATCH) {
          EventBus.getInstance().publish(
            EventType.MatchEnded,
            EventCategory.OPERATIONAL,
            { match: updatedMatch, finalScore: `${homeScore} - ${awayScore}` },
            "SIMULATION_ENGINE",
            "HIGH"
          );
        }
      }
    }

    // 4. Update Gate Wait Times and Flow Rates
    const gates = await mockDb.gates.getAll();
    for (const gate of gates) {
      let waitTime = gate.waitTimeMinutes;
      let flowRate = gate.currentFlowRate;
      let queueLen = gate.queueLength;

      if (nextStage === "Pregame") {
        waitTime = Math.max(1, waitTime - 1);
        flowRate = Math.max(10, flowRate - 10);
        queueLen = Math.max(0, queueLen - 20);
      } else if (nextStage === "Ingress") {
        // Gates G and C are naturally congested
        const multiplier = gate.id === "G-G-SOUTHWEST" ? 1.5 : gate.id === "G-C-WEST" ? 1.2 : 0.8;
        flowRate = Math.floor((100 + Math.sin(this.state.tickCount / 2) * 20) * multiplier);
        queueLen = Math.floor(queueLen + flowRate * 0.15);
        waitTime = Math.floor(queueLen / 150);

        // Apply scenario multipliers
        if (this.state.activeScenarioId === "SC-RAIN") {
          waitTime = Math.floor(waitTime * 1.4);
          flowRate = Math.floor(flowRate * 0.7);
        } else if (this.state.activeScenarioId === "SC-SOLD-OUT") {
          waitTime = Math.floor(waitTime * 1.6);
          queueLen = Math.floor(queueLen * 1.3);
        } else if (this.state.activeScenarioId === "SC-STRIKE") {
          if (gate.id === "G-G-SOUTHWEST") {
            waitTime = Math.floor(waitTime * 1.9); // Metro users dump into southwest gate
            queueLen = Math.floor(queueLen * 1.7);
          }
        }
      } else if (nextStage === "Kickoff" || nextStage === "Second Half" || nextStage === "Halftime") {
        // Most spectators are inside
        flowRate = Math.max(5, Math.floor(flowRate * 0.4));
        queueLen = Math.max(10, Math.floor(queueLen * 0.3));
        waitTime = Math.max(1, Math.floor(queueLen / 180));
      } else if (nextStage === "Egress") {
        // Flows are outward, which is rapid
        flowRate = gate.id === "G-G-SOUTHWEST" ? 550 : 350;
        queueLen = Math.max(0, queueLen - flowRate * 0.2);
        waitTime = Math.max(1, Math.floor(queueLen / 200));

        if (isEvacuating) {
          flowRate = 1200; // Evacuation rate is huge
          waitTime = 0;
          queueLen = 0;
        }
      } else {
        waitTime = 1;
        flowRate = 0;
        queueLen = 0;
      }

      await mockDb.gates.update(gate.id, {
        waitTimeMinutes: Math.max(0, waitTime),
        currentFlowRate: Math.max(0, flowRate),
        queueLength: Math.max(0, queueLen),
        lastUpdatedAt: this.state.simulationTime
      });

      EventBus.getInstance().publish(
        EventType.GateQueueUpdated,
        EventCategory.OPERATIONAL,
        {
          gateId: gate.id,
          queueLength: Math.max(0, queueLen),
          waitTimeMinutes: Math.max(0, waitTime),
          currentFlowRate: Math.max(0, flowRate)
        },
        "SIMULATION_ENGINE",
        Math.max(0, waitTime) >= 15 ? "HIGH" : "MEDIUM"
      );
    }

    // 5. Update Crowd Zone Densities
    const zones = await mockDb.crowdZones.getAll();
    for (const zone of zones) {
      let density = zone.densityPercentage;
      let headcount = zone.estimatedHeadcount;

      if (nextStage === "Pregame") {
        density = 10;
        headcount = 150;
      } else if (nextStage === "Ingress") {
        if (zone.id === "CZ-CONC-G") {
          density = Math.min(95, 60 + this.state.tickCount * 4);
        } else if (zone.id === "CZ-METRO-PL") {
          density = Math.min(85, 45 + this.state.tickCount * 3);
        } else {
          density = Math.min(70, 30 + this.state.tickCount * 2);
        }
        headcount = Math.floor(density * 45);

        if (this.state.activeScenarioId === "SC-STRIKE" && zone.id === "CZ-METRO-PL") {
          density = 98; // Peak load on platform due to strike
          headcount = 6500;
        }
      } else if (nextStage === "Halftime") {
        // Concourses fill up during halftime
        density = zone.id.includes("CONC") ? Math.min(95, density + 25) : Math.max(20, density - 20);
        headcount = Math.floor(density * 50);
      } else if (nextStage === "Second Half") {
        density = zone.id.includes("CONC") ? Math.max(30, density - 15) : Math.min(90, density + 15);
        headcount = Math.floor(density * 40);
      } else if (nextStage === "Egress") {
        if (zone.id === "CZ-METRO-PL") {
          density = Math.min(98, 70 + (diffMins - 120) * 2);
        } else {
          density = Math.max(20, density - 10);
        }
        headcount = Math.floor(density * 45);
      } else {
        density = 5;
        headcount = 0;
      }

      let status: "NOMINAL" | "MODERATE" | "CRITICAL" = "NOMINAL";
      if (density >= 85) status = "CRITICAL";
      else if (density >= 60) status = "MODERATE";

      await mockDb.crowdZones.update(zone.id, {
        densityPercentage: density,
        estimatedHeadcount: headcount,
        status,
        lastUpdatedAt: this.state.simulationTime
      });

      EventBus.getInstance().publish(
        EventType.CrowdDensityChanged,
        EventCategory.OPERATIONAL,
        {
          zoneId: zone.id,
          densityPercentage: density,
          estimatedHeadcount: headcount
        },
        "SIMULATION_ENGINE",
        density >= 85 ? "CRITICAL" : density >= 60 ? "HIGH" : "LOW"
      );
    }

    // 6. Execute Scenario-Specific Events/Incidents Schedule
    const { incidents, notifications, recommendations } = await this.runScenarioEvents(
      this.state.activeScenarioId || "SC-NORMAL",
      this.state.tickCount,
      diffMins
    );

    incidentsTriggered.push(...incidents);
    notificationsTriggered.push(...notifications);
    recommendationsTriggered.push(...recommendations);

    const duration = endMeasure();
    telemetry.incrementMetric("simulationTicksCount");
    telemetry.reportComponentStatus("SimulationEngine", "OK", duration);
    telemetry.log("INFO", `Simulation engine ticked successfully at virtual time ${this.state.simulationTime}`, {
      tickCount: this.state.tickCount,
      durationMs: duration,
      scenario: this.state.activeScenarioId,
      incidentsTriggered: incidentsTriggered.length,
    });

    return { incidentsTriggered, notificationsTriggered, recommendationsTriggered };
  }

  // SCHEDULED SCENARIO ENGINE EVENT MATH
  private async runScenarioEvents(
    scenarioId: string,
    tick: number,
    diffMins: number
  ): Promise<{
    incidents: Incident[];
    notifications: Notification[];
    recommendations: OperationalRecommendation[];
  }> {
    const incidents: Incident[] = [];
    const notifications: Notification[] = [];
    const recommendations: OperationalRecommendation[] = [];

    // HELPER: trigger a formal event and incident
    const triggerIncident = async (params: {
      id: string;
      category: IncidentCategory;
      severity: Severity;
      sector: string;
      section: string;
      description: string;
      priority: ActionPriority;
      recTitle: string;
      recText: string;
      recOutcome: string;
    }) => {
      // Check if incident already exists
      const existing = await mockDb.incidents.getById(params.id);
      if (existing) return;

      const createdInc = await mockDb.incidents.create({
        id: params.id,
        stadiumId: "V-LUSAIL",
        severity: params.severity,
        status: IncidentStatus.OPEN,
        category: params.category,
        description: params.description,
        location: { sector: params.sector, section: params.section },
        assignedStaff: [],
        reporterId: "SYSTEM_MONITOR"
      });
      incidents.push(createdInc);

      EventBus.getInstance().publish(
        EventType.IncidentCreated,
        EventCategory.OPERATIONAL,
        { incident: createdInc },
        "SIMULATION_ENGINE",
        createdInc.severity === Severity.CRITICAL ? "CRITICAL" : "HIGH"
      );

      const notif = await this.publishNotification(
        `Critical Incident Raised: ${params.id}`,
        params.description,
        params.category === IncidentCategory.CROWD ? "FLOW" : params.category === IncidentCategory.FACILITIES ? "SYSTEM" : "INCIDENT",
        params.severity === Severity.CRITICAL ? "CRITICAL" : "WARNING",
        createdInc.id
      );
      notifications.push(notif);

      const rec = await mockDb.recommendations.create({
        id: `REC-${params.id}`,
        incidentId: createdInc.id,
        title: params.recTitle,
        reason: params.description,
        evidence: [
          `Telemetry signal flagged anomaly in ${params.sector} ${params.section}`,
          `Sensor readings matching hazard profile ${params.category}`
        ],
        recommendedAction: params.recText,
        expectedOutcome: params.recOutcome,
        confidenceScore: 0.92,
        priority: params.priority,
        status: DecisionState.PENDING,
        createdAt: this.state.simulationTime
      });
      recommendations.push(rec);

      EventBus.getInstance().publish(
        EventType.RecommendationGenerated,
        EventCategory.AI,
        { recommendation: rec },
        "SIMULATION_ENGINE",
        rec.priority === ActionPriority.HIGH ? "HIGH" : "MEDIUM"
      );

      // Create a simulation event for internal tracing/replay
      const simEv: SimulationEvent = {
        id: `EV-${params.id}`,
        name: params.recTitle,
        type: params.category,
        timestamp: this.state.simulationTime,
        priority: params.severity === Severity.CRITICAL ? "HIGH" : "MEDIUM",
        affectedLocation: { sector: params.sector, section: params.section },
        affectedStakeholders: ["fans", "operators", "stewards"],
        durationMinutes: 30,
        isResolved: false,
        description: params.description
      };
      this.state.activeEvents.push(simEv);
      this.state.history.push(simEv);
    };

    // SCENARIO SWITCHBOARD
    switch (scenarioId) {
      case "SC-RAIN":
        if (tick === 3) {
          await mockDb.transport.update("TR-SHUTTLE-B", {
            status: "DELAYED",
            headwayMinutes: 14,
            currentAdvisory: "Rain slick roads in the northern sector forced shuttle speed limit caps."
          });
          notifications.push(await this.publishNotification(
            "Weather Delay Alert: Shuttles",
            "Shuttle Loop B is reporting a 14-minute headway delay due to water accumulation on outer perimeter ring road.",
            "WEATHER",
            "WARNING"
          ));
        }
        if (tick === 6) {
          await triggerIncident({
            id: "INC-RAIN-LEAK",
            category: IncidentCategory.FACILITIES,
            severity: Severity.WARNING,
            sector: "East Stand",
            section: "Food Court Concourse",
            description: "Water leaking through architectural seal above concession hub 4B. Creating pooling hazard on floor.",
            priority: ActionPriority.MEDIUM,
            recTitle: "Water Line Diverter & Sandbag Deployment",
            recText: "Dispatch maintenance crew with wet-vaccum extraction systems and lay anti-slip rubber runner carpets.",
            recOutcome: "Contain standing water risk, safeguard concession pathways, and bypass local structural electrical links."
          });
        }
        break;

      case "SC-HIGH-RISK":
        if (tick === 4) {
          await triggerIncident({
            id: "INC-RISK-CROWD",
            category: IncidentCategory.SECURITY,
            severity: Severity.CRITICAL,
            sector: "South Curve",
            section: "Aisle 104 Access Tunnel",
            description: "High friction and chanting between rival fans at Aisle 104 entryway blocking thoroughfare.",
            priority: ActionPriority.HIGH,
            recTitle: "Deploy Rapid Security Response",
            recText: "Instruct Response Squad Delta to deploy barrier lines to cordon spectator cohorts and re-route seating flow.",
            recOutcome: "Diffuse localized aggression, restore pedestrian flow, and establish a clear separation corridor."
          });
        }
        break;

      case "SC-SOLD-OUT":
        if (tick === 5) {
          await triggerIncident({
            id: "INC-SOLD-G",
            category: IncidentCategory.CROWD,
            severity: Severity.CRITICAL,
            sector: "Southwest Turnstiles",
            section: "Gate G-4 Queue Lines",
            description: "Critical queue surge at Southwest turnstiles. Average wait times have climbed to 22 minutes.",
            priority: ActionPriority.HIGH,
            recTitle: "Activate Overflow Turnstile Redistribution",
            recText: "Open auxiliary corridors G-5 and G-6, and direct stewards to manually scan tickets via mobile scanners.",
            recOutcome: "Halve turnstile congestion times and lower wait times below standard 8-minute operational bounds."
          });
        }
        break;

      case "SC-VIP":
        if (tick === 3) {
          const simEv: SimulationEvent = {
            id: "EV-VIP-ARRIVE",
            name: "VIP Motorcade Arrival",
            type: "VIP_VISIT",
            timestamp: this.state.simulationTime,
            priority: "LOW",
            affectedLocation: { sector: "VIP Hub", section: "Gate E" },
            affectedStakeholders: ["VIP", "Security Protocol"],
            durationMinutes: 15,
            isResolved: false,
            description: "Diplomatic motorcade has crossed the outer ring security gates. Standby protocol active."
          };
          this.state.activeEvents.push(simEv);
          this.state.history.push(simEv);

          notifications.push(await this.publishNotification(
            "VIP Motorcade Approaching Gate E",
            "State delegation transit approaching Gate E. Standby escort crews assigned.",
            "FLOW",
            "INFO"
          ));
        }
        break;

      case "SC-STRIKE":
        if (tick === 2) {
          await mockDb.transport.update("TR-METRO-2", {
            status: "SUSPENDED",
            headwayMinutes: 999,
            currentAdvisory: "Metro Line 2 suspended due to signaling strike."
          });
          notifications.push(await this.publishNotification(
            "METRO LINE 2 SUSPENDED",
            "Central Metro Loop is fully suspended. Directing all passengers to Shuttle bus platforms.",
            "TRANSPORT",
            "CRITICAL"
          ));

          await triggerIncident({
            id: "INC-METRO-STRIKE",
            category: IncidentCategory.CROWD,
            severity: Severity.CRITICAL,
            sector: "West Ingress Hub",
            section: "Bus Transit Plaza",
            description: "Over 4,500 spectators accumulated at Shuttle loop platforms due to Metro suspension.",
            priority: ActionPriority.HIGH,
            recTitle: "Emergency Backup Shuttle Mobilization",
            recText: "Activate emergency backup contract with Al Daayen Shuttle depot to mobilize 25 municipal buses.",
            recOutcome: "Provide mass transit capacity, prevent plaza overcrowding, and safely evacuate spectators."
          });
        }
        break;

      case "SC-HEAT":
        if (tick === 3) {
          await triggerIncident({
            id: "INC-HEAT-MED1",
            category: IncidentCategory.MEDICAL,
            severity: Severity.WARNING,
            sector: "South Concourse",
            section: "Aisle 212 Landing",
            description: "Spectator collapsing due to heat exhaustion and dehydration symptoms.",
            priority: ActionPriority.MEDIUM,
            recTitle: "Deploy Medical Echo & Hydration Support",
            recText: "Dispatch Medical Team Echo with cooling stretcher unit to South Concourse and deliver fluids.",
            recOutcome: "Provide instant stabilization, move patient to air-conditioned triage, and keep walkways clear."
          });
        }
        break;

      case "SC-EVAC":
        if (tick === 3) {
          // Trigger critical fire hazard incident
          await triggerIncident({
            id: "INC-EVAC-FIRE",
            category: IncidentCategory.FACILITIES,
            severity: Severity.CRITICAL,
            sector: "North Stand",
            section: "Electrical Substation B",
            description: "Smoke and thermal sensor alarms in Electrical Substation B. Stadium wide evacuation ordered.",
            priority: ActionPriority.HIGH,
            recTitle: "Engage Emergency Evacuation Protocol",
            recText: "Activate standard public announcement sirens, set all gates to OPEN (egress), and deploy safety stewards.",
            recOutcome: "Safely evacuate 84,000 spectators through all exits within 9 minutes."
          });

          // Mutate all gates to open
          const allGates = await mockDb.gates.getAll();
          for (const g of allGates) {
            await mockDb.gates.update(g.id, {
              status: "OPEN",
              waitTimeMinutes: 0,
              queueLength: 0,
              currentFlowRate: 1500
            });
          }
        }
        break;

      case "SC-POWER":
        if (tick === 3) {
          await triggerIncident({
            id: "INC-POWER-FAIL",
            category: IncidentCategory.FACILITIES,
            severity: Severity.CRITICAL,
            sector: "West Concourse",
            section: "Substation Area 1",
            description: "Main grid power failure detected. Auxiliary generators active but gate ticketing scanners running on battery backup.",
            priority: ActionPriority.HIGH,
            recTitle: "Backup Power Stabilization & Gate Scan Redirection",
            recText: "Instruct electrical response teams to balance auxiliary power loads and deploy manual offline scanning protocols.",
            recOutcome: "Restore terminal operations, prevent gate bottlenecks, and protect primary venue systems."
          });
        }
        break;

      case "SC-ACCESS":
        if (tick === 3) {
          await triggerIncident({
            id: "INC-ACCESS-DEL",
            category: IncidentCategory.CROWD,
            severity: Severity.WARNING,
            sector: "North Gate D",
            section: "Accessible Entry Ramp",
            description: "Arrival of a 40-spectator delegation requiring wheelchair ramps and elevators. Processing queues delayed.",
            priority: ActionPriority.HIGH,
            recTitle: "Activate Priority Elevator and Mobility Escort",
            recText: "Redistribute 4 volunteers to accessible Gate D and allocate 2 golf-cart shuttle responders to ramp landings.",
            recOutcome: "Eliminate bottleneck at Gate D elevator, secure swift transport to designated accessible viewing zone."
          });
        }
        break;

      default:
        // SC-NORMAL or other
        break;
    }

    return { incidents, notifications, recommendations };
  }

  // UTILITY FOR NOTIFICATION CREATION
  private async publishNotification(
    title: string,
    message: string,
    category: Notification["category"],
    severity: Notification["severity"],
    associatedId?: string
  ): Promise<Notification> {
    return await mockDb.notifications.create({
      timestamp: this.state.simulationTime,
      title,
      message,
      category,
      severity,
      isRead: false,
      associatedId
    });
  }
}
