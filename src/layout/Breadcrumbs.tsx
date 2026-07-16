/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/src/utils/classnames";
import { useShell } from "./ShellProvider";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Optional manual override of breadcrumb items. If not supplied, 
   * items are derived dynamically from the active navigation ID in the shell.
   */
  items?: BreadcrumbItem[];
}

/**
 * Highly accessible Breadcrumbs navigation component.
 * Adheres strictly to the WAI-ARIA breadcrumb pattern.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className, items, ...props }) => {
  const { activeNavId } = useShell();

  // Helper to resolve standard paths based on active nav ID
  const defaultItems = React.useMemo(() => {
    const base: BreadcrumbItem[] = [
      { label: "Tournament Operations", href: "#dashboard" },
    ];

    switch (activeNavId) {
      case "dashboard":
        base.push({ label: "Operations Dashboard", isCurrent: true });
        break;
      case "incidents":
        base.push({ label: "Incident Management", href: "#incidents" });
        base.push({ label: "Active Incident Registry", isCurrent: true });
        break;
      case "map":
        base.push({ label: "Venue Map Overlays", href: "#map" });
        base.push({ label: "Stadium Gate Layout", isCurrent: true });
        break;
      case "telemetry":
        base.push({ label: "Crowd Flow Telemetry", href: "#telemetry" });
        base.push({ label: "Live Flow Ingress", isCurrent: true });
        break;
      case "settings":
        base.push({ label: "Console Settings", isCurrent: true });
        break;
      default:
        base.push({ label: "Operations Node", isCurrent: true });
    }

    return base;
  }, [activeNavId]);

  const activeItems = items || defaultItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-xs py-1 text-xs font-sans normal-case tracking-normal text-text-secondary", className)}
      {...props}
    >
      <ol className="inline-flex items-center space-x-1.5" id="breadcrumb-list">
        <li className="inline-flex items-center" id="breadcrumb-home-item">
          <a
            href="#dashboard"
            className="flex items-center hover:text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 rounded-md p-1"
            aria-label="Home / Tournament Operations"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </li>

        {activeItems.map((item, idx) => {
          const isLast = idx === activeItems.length - 1 || item.isCurrent;
          return (
            <li key={idx} className="inline-flex items-center gap-1.5" id={`breadcrumb-item-${idx}`}>
              <ChevronRight className="w-3 h-3 text-text-muted shrink-0" aria-hidden="true" />
              {isLast ? (
                <span
                  className="font-medium text-text-primary select-none"
                  aria-current="page"
                  id={`breadcrumb-label-${idx}`}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || "#"}
                  className="hover:text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 rounded-md px-1.5 py-0.5"
                  id={`breadcrumb-link-${idx}`}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
