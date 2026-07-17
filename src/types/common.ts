/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MatchStatus {
  PRE_MATCH = "PRE_MATCH",
  LIVE = "LIVE",
  POST_MATCH = "POST_MATCH",
  DORMANT = "DORMANT",
}

export enum StaffRole {
  TOC_OPERATOR = "TOC_OPERATOR",
  SECURITY = "SECURITY",
  VOLUNTEER = "VOLUNTEER",
  VENUE_STAFF = "VENUE_STAFF",
}

export enum StaffStatus {
  ON_DUTY = "ON_DUTY",
  DISPATCHED = "DISPATCHED",
  OFF_DUTY = "OFF_DUTY",
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface StaffResource {
  id: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  skills: string[];
  currentSector?: string;
  deviceId?: string;
  lastActiveAt: string; // ISO string
}

export interface AuditLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  service: string;
  traceId?: string;
  operatorId?: string;
  message: string;
  details?: Record<string, unknown>;
}
