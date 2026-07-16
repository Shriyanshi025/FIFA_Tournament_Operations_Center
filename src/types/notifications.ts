/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Notification {
  id: string;
  timestamp: string; // ISO string
  title: string;
  message: string;
  category: "INCIDENT" | "FLOW" | "WEATHER" | "TRANSPORT" | "SYSTEM";
  severity: "INFO" | "WARNING" | "CRITICAL";
  isRead: boolean;
  associatedId?: string; // E.g., incidentId or matchId
}
