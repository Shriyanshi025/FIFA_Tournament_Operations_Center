/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  type: 
    | "NORMAL_MATCH" 
    | "HEAVY_RAIN" 
    | "HIGH_RISK_MATCH" 
    | "SOLD_OUT_MATCH" 
    | "VIP_VISIT" 
    | "TRANSPORT_STRIKE" 
    | "MEDICAL_SURGE" 
    | "EMERGENCY_EVACUATION" 
    | "PENALTY_SHOOTOUT"
    | "POWER_FAILURE"
    | "ACCESSIBILITY_REQUEST";
  startTime?: string;
}

export interface SimulationEvent {
  id: string;
  name: string;
  type: string;
  timestamp: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  affectedLocation: {
    sector: string;
    section: string;
    gateId?: string;
  };
  affectedStakeholders: string[]; // e.g. ["fans", "volunteers", "security", "medical"]
  durationMinutes: number;
  dependencies?: string[]; // IDs or names of other events/conditions that must be resolved first
  recoveryConditions?: string[]; // e.g. ["VOLUNTEER_DISPATCHED", "INCIDENT_RESOLVED"]
  isResolved: boolean;
  description: string;
}

export interface SimulationEngineState {
  currentStage: "Pregame" | "Ingress" | "Kickoff" | "Halftime" | "Second Half" | "Final Whistle" | "Egress" | "Closed";
  simulationTime: string; // ISO string representing simulated UTC clock
  speedMultiplier: number; // 1x, 2x, 5x, 10x
  isPaused: boolean;
  activeScenarioId: string | null;
  history: SimulationEvent[];
  activeEvents: SimulationEvent[];
  tickCount: number;
}
