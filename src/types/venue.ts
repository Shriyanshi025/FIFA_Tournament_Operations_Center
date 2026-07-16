/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates } from "./common";

export interface Gate {
  id: string;
  venueId: string;
  name: string; // e.g., "Gate G-4 Southwest"
  status: "OPEN" | "CLOSED" | "RESTRICTED";
  targetCapacity: number; // fans/min
  currentFlowRate: number; // fans/min
  waitTimeMinutes: number;
  queueLength: number; // estimated number of people in queue
  lastUpdatedAt: string;
}

export interface CrowdZone {
  id: string;
  venueId: string;
  name: string; // e.g., "Concourse A East"
  densityPercentage: number; // 0 to 100
  status: "NOMINAL" | "MODERATE" | "CONGESTED" | "CRITICAL";
  estimatedHeadcount: number;
  lastUpdatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  coordinates: Coordinates;
  sectors: string[]; // e.g., ["North", "East", "South", "West"]
  isActive: boolean;
}
