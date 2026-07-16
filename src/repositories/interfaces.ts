/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Repository } from "./base";
import { 
  Incident, 
  Match, 
  Gate, 
  CrowdZone, 
  Volunteer, 
  MedicalTeam, 
  SecurityTeam, 
  Resource, 
  AccessibilityResource,
  Notification, 
  OperationalRecommendation,
  TransportLine
} from "../types";

export interface IncidentRepository extends Repository<Incident> {
  getByStatus(status: Incident["status"]): Promise<Incident[]>;
  getBySeverity(severity: Incident["severity"]): Promise<Incident[]>;
  getByCategory(category: Incident["category"]): Promise<Incident[]>;
}

export interface MatchRepository extends Repository<Match> {
  getActiveMatch(): Promise<Match | null>;
  getByStadium(stadiumId: string): Promise<Match[]>;
}

export interface GateRepository extends Repository<Gate> {
  getByVenue(venueId: string): Promise<Gate[]>;
  getHighWaitGates(thresholdMinutes: number): Promise<Gate[]>;
}

export interface CrowdZoneRepository extends Repository<CrowdZone> {
  getByVenue(venueId: string): Promise<CrowdZone[]>;
  getCongestedZones(): Promise<CrowdZone[]>;
}

export interface VolunteerRepository extends Repository<Volunteer> {
  getBySector(sector: string): Promise<Volunteer[]>;
  getAvailableVolunteers(): Promise<Volunteer[]>;
}

export interface MedicalTeamRepository extends Repository<MedicalTeam> {
  getAvailableTeams(): Promise<MedicalTeam[]>;
}

export interface SecurityTeamRepository extends Repository<SecurityTeam> {
  getBySector(sector: string): Promise<SecurityTeam[]>;
}

export interface ResourceRepository extends Repository<Resource> {
  getByType(type: Resource["type"]): Promise<Resource[]>;
  getAvailableResources(): Promise<Resource[]>;
}

export interface AccessibilityResourceRepository extends Repository<AccessibilityResource> {
  getBySector(sector: string): Promise<AccessibilityResource[]>;
  getFaultyResources(): Promise<AccessibilityResource[]>;
}

export interface NotificationRepository extends Repository<Notification> {
  getUnread(): Promise<Notification[]>;
  markAllAsRead(): Promise<void>;
}

export interface RecommendationRepository extends Repository<OperationalRecommendation> {
  getPending(): Promise<OperationalRecommendation[]>;
  getByIncidentId(incidentId: string): Promise<OperationalRecommendation[]>;
}

export interface TransportRepository extends Repository<TransportLine> {
  getDelayedLines(): Promise<TransportLine[]>;
}
