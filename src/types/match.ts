/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchStatus } from "./common";

export interface Weather {
  temperature: number; // in Celsius
  condition: string; // e.g. "Clear", "Humid", "Rainy"
  windSpeed: number; // in km/h
  humidity: number; // percentage
  advisory?: string; // Weather warning if any
  lastUpdatedAt: string;
}

export interface TransportLine {
  id: string;
  name: string; // e.g., "Metro Line 2", "Shuttle Loop B"
  type: "METRO" | "SHUTTLE" | "BUS" | "TRAIN";
  status: "NOMINAL" | "DELAYED" | "SUSPENDED";
  headwayMinutes: number;
  passengerLoad: "LOW" | "MODERATE" | "HIGH" | "PEAK";
  currentAdvisory?: string;
  lastUpdatedAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchNumber: number;
  kickOffTime: string; // ISO String
  status: MatchStatus;
  currentMinute?: number;
  scoreHome?: number;
  scoreAway?: number;
  attendance?: number;
  stadiumId: string;
  isHighRisk: boolean;
}
