/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchStatus } from "./common";

export interface GateConfig {
  id: string;
  name: string;
  targetCapacity: number;
  currentScansPerMinute?: number;
  currentWaitTimeMinutes?: number;
}

export interface Stadium {
  id: string;
  name: string;
  capacity: number;
  matchStatus: MatchStatus;
  config: {
    gates: GateConfig[];
    sectors: string[];
  };
}

export interface TelemetryStreamData {
  zoneId: string;
  scansPerMinute: number;
  waitTime: number;
  densityPercentage: number; // 0 to 100
  timestamp: string;
}
