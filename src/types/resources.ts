/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaffStatus } from "./common";

export interface Volunteer {
  id: string;
  name: string;
  status: StaffStatus;
  assignedSector: string;
  languages: string[];
  skills: string[]; // e.g., "First Aid", "Crowd Control", "Information Desk"
  lastActiveAt: string;
  contactNumber: string;
}

export interface MedicalTeam {
  id: string;
  name: string; // e.g., "Medical Team Echo"
  stationName: string; // e.g., "Sector South First Aid Hub"
  status: StaffStatus;
  stretcherAvailable: boolean;
  paramedicCount: number;
  assignedIncidents: string[]; // Incident IDs
  lastActiveAt: string;
}

export interface SecurityTeam {
  id: string;
  name: string; // e.g., "Response Squad Delta"
  status: StaffStatus;
  assignedSector: string;
  memberCount: number;
  hasK9Unit: boolean;
  assignedIncidents: string[];
  lastActiveAt: string;
}

export interface Resource {
  id: string;
  name: string; // e.g., "Megaphone Set B", "Backup Credential Printer"
  type: "EQUIPMENT" | "VEHICLE" | "COMMUNICATION" | "FACILITY";
  status: "AVAILABLE" | "DEPLOYED" | "MAINTENANCE" | "FAULT";
  assignedSector?: string;
  currentLocation?: string;
  assignedToId?: string; // Volunteer/Team/Staff ID
}

export interface AccessibilityResource {
  id: string;
  name: string; // e.g., "Wheelchair Station A", "Gate C Elevators"
  type: "WHEELCHAIR" | "ELEVATOR" | "RAMP" | "ASSISTIVE_AUDIO";
  status: "OPERATIONAL" | "LIMITED" | "OUT_OF_SERVICE";
  assignedSector: string;
  currentLoad: "LOW" | "MODERATE" | "HIGH";
  lastUpdatedAt: string;
}
