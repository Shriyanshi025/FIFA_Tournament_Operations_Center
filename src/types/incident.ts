/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates } from "./common";

export enum Severity {
  CRITICAL = "CRITICAL",
  WARNING = "WARNING",
  INFORMATIONAL = "INFORMATIONAL",
}

export enum IncidentStatus {
  OPEN = "OPEN",
  RESPONDING = "RESPONDING",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum IncidentCategory {
  CROWD = "CROWD",
  MEDICAL = "MEDICAL",
  SECURITY = "SECURITY",
  FACILITIES = "FACILITIES",
}

export interface IncidentLocation {
  sector: string;
  section: string;
  row?: string;
  seat?: string;
  coordinates?: Coordinates;
}

export interface Incident {
  id: string;
  stadiumId: string;
  severity: Severity;
  status: IncidentStatus;
  category: IncidentCategory;
  description: string;
  location: IncidentLocation;
  assignedStaff: string[]; // StaffResource IDs
  reporterId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isDeleted: boolean;
}
