/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Incident, 
  Gate, 
  CrowdZone, 
  Match, 
  TransportLine, 
  Weather, 
  OperationalRecommendation 
} from "./index";

/**
 * High-level categories to isolate event concerns.
 */
export enum EventCategory {
  OPERATIONAL = "OPERATIONAL",
  SIMULATION = "SIMULATION",
  AI = "AI",
  UI = "UI",
  AUDIT = "AUDIT",
  SYSTEM = "SYSTEM"
}

/**
 * Standardized system-wide event types.
 */
export enum EventType {
  MatchStarted = "MatchStarted",
  MatchEnded = "MatchEnded",
  CrowdDensityChanged = "CrowdDensityChanged",
  GateQueueUpdated = "GateQueueUpdated",
  IncidentCreated = "IncidentCreated",
  IncidentResolved = "IncidentResolved",
  VolunteerAssigned = "VolunteerAssigned",
  MedicalDispatched = "MedicalDispatched",
  TransportUpdated = "TransportUpdated",
  WeatherUpdated = "WeatherUpdated",
  RecommendationGenerated = "RecommendationGenerated",
  RecommendationApproved = "RecommendationApproved",
  RecommendationRejected = "RecommendationRejected",
  SimulationPaused = "SimulationPaused",
  SimulationResumed = "SimulationResumed",
  SimulationReset = "SimulationReset"
}

/**
 * Mapping of EventTypes to their strongly-typed payloads.
 */
export interface EventPayloadMap {
  [EventType.MatchStarted]: { match: Match; timestamp: string };
  [EventType.MatchEnded]: { match: Match; finalScore: string };
  [EventType.CrowdDensityChanged]: { zoneId: string; densityPercentage: number; estimatedHeadcount: number };
  [EventType.GateQueueUpdated]: { gateId: string; queueLength: number; waitTimeMinutes: number; currentFlowRate: number };
  [EventType.IncidentCreated]: { incident: Incident };
  [EventType.IncidentResolved]: { incidentId: string; resolvedAt: string; status: string };
  [EventType.VolunteerAssigned]: { incidentId: string; volunteerId: string; role: string };
  [EventType.MedicalDispatched]: { teamId: string; incidentId: string; estimatedArrivalMins: number };
  [EventType.TransportUpdated]: { transportLine: TransportLine };
  [EventType.WeatherUpdated]: { weather: Weather };
  [EventType.RecommendationGenerated]: { recommendation: OperationalRecommendation };
  [EventType.RecommendationApproved]: { recommendationId: string; approvedAt: string };
  [EventType.RecommendationRejected]: { recommendationId: string; rejectedAt: string; reason?: string };
  [EventType.SimulationPaused]: { pausedAt: string; reason?: string };
  [EventType.SimulationResumed]: { resumedAt: string };
  [EventType.SimulationReset]: { resetTime: string };
}

/**
 * Envelope-level metadata structure mandatory for auditing and replay.
 */
export interface EventMetadata {
  id: string;             // Unique event ID (UUID or custom string sequence)
  timestamp: string;      // ISO-8601 creation timestamp
  source: string;         // Origin subsystem (e.g., "SIMULATION_ENGINE", "AI_COPILOT", "INCIDENT_DISPATCH")
  correlationId?: string; // Links related flows together (e.g., Incident -> AI recommendation -> Staff Assignment)
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  version: string;        // Schema payload version (e.g. "1.0")
}

/**
 * Universal payload wrapper (event envelope).
 */
export interface AppEvent<T extends EventType = EventType> {
  type: T;
  category: EventCategory;
  metadata: EventMetadata;
  payload: EventPayloadMap[T];
}
