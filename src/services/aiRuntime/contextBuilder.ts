/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockDb } from "../../repositories/mock";
import { SimulationEngine } from "../simulation/SimulationEngine";
import { AIRequestContext } from "./types";
import { Match, Weather, Incident } from "../../types";

export class ContextBuilder {
  /**
   * Generates a fully populated, normalized context snapshot representing 
   * the exact live operational state of the stadium.
   */
  public static async buildContext(operatorSession?: {
    userId: string;
    role: string;
  }): Promise<AIRequestContext> {
    const engine = SimulationEngine.getInstance();
    const engineState = engine.getState();
    const activeScenarioId = engineState.activeScenarioId || "SC-NORMAL";

    // 1. Resolve Match State from Mock DB
    let matchState: Match | null = null;
    try {
      const matches = await mockDb.matches.getAll();
      matchState = matches.find(m => m.id === "M-42") || null;
    } catch (err) {
      console.error("[ContextBuilder] Failed to load match state:", err);
    }

    // 2. Resolve Weather State dynamically based on Active Scenario (mirroring context weather logic)
    const isRain = activeScenarioId === "SC-RAIN";
    const isHeat = activeScenarioId === "SC-HEAT";
    const weatherState: Weather = {
      temperature: isHeat ? 39 : isRain ? 21 : 28,
      condition: isRain ? "Rainy" : "Clear",
      windSpeed: isRain ? 25 : 12,
      humidity: isRain ? 90 : 45,
      advisory: isHeat 
        ? "Extreme heat advisory. Hydration protocols are active. Cooling zones deployed."
        : isRain 
          ? "Rain warning. Concourses may be slippery. Transport delays possible."
          : "Nominal weather conditions.",
      lastUpdatedAt: engineState.simulationTime
    };

    // 3. Resolve Incidents
    let activeIncidents: Incident[] = [];
    try {
      activeIncidents = await mockDb.incidents.getAll();
    } catch (err) {
      console.error("[ContextBuilder] Failed to load incidents:", err);
    }

    // 4. Resolve Crowd Zones
    let crowdZones: any[] = [];
    try {
      crowdZones = await mockDb.crowdZones.getAll();
    } catch (err) {
      console.error("[ContextBuilder] Failed to load crowd zones:", err);
    }

    // 5. Resolve Gates
    let gates: any[] = [];
    try {
      gates = await mockDb.gates.getAll();
    } catch (err) {
      console.error("[ContextBuilder] Failed to load gates:", err);
    }

    // 6. Resolve Transport Lines
    let transportLines: any[] = [];
    try {
      transportLines = await mockDb.transport.getAll();
    } catch (err) {
      console.error("[ContextBuilder] Failed to load transport lines:", err);
    }

    // 7. Resolve Resources (Volunteers, Medical, Security, Accessibility)
    let volunteers: any[] = [];
    let medicalTeams: any[] = [];
    let securityTeams: any[] = [];
    let accessibilityResources: any[] = [];

    try {
      volunteers = await mockDb.volunteers.getAll();
      medicalTeams = await mockDb.medicalTeams.getAll();
      securityTeams = await mockDb.securityTeams.getAll();
      accessibilityResources = await mockDb.accessibility.getAll();
    } catch (err) {
      console.error("[ContextBuilder] Failed to load resource directories:", err);
    }

    // 8. Select Applicable Operational Policies based on Scenario
    const operationalPolicies: string[] = [
      "Standard Policy 101: All safety response staff must carry operational VHF transceivers.",
      "Crowd Safety Annex A: If density of any concourse zone exceeds 80%, immediate sector routing must be activated.",
    ];

    if (activeScenarioId === "SC-HIGH-RISK") {
      operationalPolicies.push(
        "Rivalry Policy B: Compulsory barrier separation between Sector East and Sector West.",
        "Rivalry Policy C: High-friction screening active. 100% pat-down screening at Gate Alpha."
      );
    } else if (activeScenarioId === "SC-HEAT") {
      operationalPolicies.push(
        "Heat Policy H-1: Free water bottle distribution at all gate turnstiles.",
        "Heat Policy H-2: Medical responders must patrol zone concourses on 15-minute cycles."
      );
    } else if (activeScenarioId === "SC-STRIKE") {
      operationalPolicies.push(
        "Transport Policy T-3: Deploy auxiliary shuttle buses at the Southwest transit hub.",
        "Transport Policy T-4: Station directional stewards along pathways leading to shuttle queues."
      );
    } else if (activeScenarioId === "SC-EVAC") {
      operationalPolicies.push(
        "Evacuation Policy E-9: Complete override of exit turnstiles to 'free-flowing open' state.",
        "Evacuation Policy E-10: Public address announcers to deliver standardized exit directives."
      );
    }

    return {
      timestamp: new Date().toISOString(),
      currentTime: engineState.simulationTime,
      matchState,
      weatherState,
      activeIncidents,
      crowdZones,
      gates,
      transportLines,
      resources: {
        volunteers,
        medicalTeams,
        securityTeams,
        accessibilityResources
      },
      operatorSession: operatorSession 
        ? { ...operatorSession, activeScenarioId }
        : { userId: "TOC_OPERATOR", role: "CHIEF_OPERATOR", activeScenarioId },
      operationalPolicies
    };
  }
}
