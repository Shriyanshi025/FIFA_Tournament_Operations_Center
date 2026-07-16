/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Incident, 
  IncidentStatus, 
  Severity, 
  IncidentCategory, 
  Gate, 
  Notification, 
  OperationalRecommendation,
  DecisionState,
  ActionPriority,
  StaffStatus,
  SimulationScenario
} from "../types";

export interface IncidentService {
  createIncident(params: {
    description: string;
    category: Incident["category"];
    severity: Incident["severity"];
    sector: string;
    section: string;
    stadiumId: string;
  }): Promise<Incident>;
  
  updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident>;
  assignStaffToIncident(id: string, staffIds: string[]): Promise<Incident>;
  getActiveIncidents(): Promise<Incident[]>;
}

export interface CrowdFlowService {
  getVenueGates(venueId: string): Promise<Gate[]>;
  updateGateStatus(id: string, status: Gate["status"]): Promise<Gate>;
  triggerGateReroute(fromGateId: string, toGateId: string): Promise<void>;
  getCrowdAlerts(): Promise<string[]>;
}

export interface ResourceService {
  getVolunteers(): Promise<any[]>;
  getMedicalTeams(): Promise<any[]>;
  getSecurityTeams(): Promise<any[]>;
  getAccessibilityResources(): Promise<any[]>;
  dispatchVolunteerToSector(volunteerId: string, sector: string): Promise<void>;
  updateResourceStatus(id: string, status: string): Promise<void>;
}

export interface NotificationService {
  getNotifications(): Promise<Notification[]>;
  publishNotification(title: string, message: string, category: Notification["category"], severity: Notification["severity"]): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface RecommendationService {
  getRecommendations(): Promise<OperationalRecommendation[]>;
  evaluateSituation(incidentId?: string): Promise<OperationalRecommendation[]>;
  processDecision(id: string, decision: DecisionState, operatorId: string): Promise<OperationalRecommendation>;
}

export interface SimulationService {
  getScenarios(): Promise<SimulationScenario[]>;
  startScenario(id: string): Promise<SimulationScenario>;
  stopActiveScenario(): Promise<void>;
  tickSimulation(): Promise<{
    incidentsTriggered: Incident[];
    notificationsTriggered: Notification[];
    recommendationsTriggered: OperationalRecommendation[];
  }>;
}
