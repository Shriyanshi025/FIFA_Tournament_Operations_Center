/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaffRole } from "./common";

export type ThemeType = "default" | "light" | "high-contrast" | "emergency";

export interface NavigationItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name string for dynamic/future lazy loading
  href?: string;
  badgeCount?: number;
  badgeVariant?: "critical" | "warning" | "success" | "info" | "neutral";
  requiredRoles?: StaffRole[];
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export interface LayoutPreferences {
  denseMode: boolean;
  showCopilotPanel: boolean;
  showSystemHealth: boolean;
}
