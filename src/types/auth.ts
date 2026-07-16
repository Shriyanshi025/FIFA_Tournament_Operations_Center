/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaffRole } from "./common";

export interface OperatorSession {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    role: StaffRole;
    assignedSector?: string;
  };
}

export interface AuthCredentials {
  username: string;
  pin: string;
  activeStation: string;
}
