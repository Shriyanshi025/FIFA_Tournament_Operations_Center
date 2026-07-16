/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map, 
  Activity, 
  Settings, 
  ChevronsLeft, 
  ChevronsRight, 
  ShieldAlert, 
  Lock,
  Radio,
  FileSpreadsheet,
  Users
} from "lucide-react";
import { cn } from "@/src/utils/classnames";
import { useShell } from "./ShellProvider";
import { Badge } from "../components/ui/Badge";
import { NavigationGroup, NavigationItem } from "../types/layout";
import { StaffRole } from "../types/common";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

export const Sidebar: React.FC<SidebarProps> = ({ className, ...props }) => {
  const { 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    activeNavId,
    setActiveNavId,
    setTheme
  } = useShell();

  // Current simulation user role for visual clearance verification (TOC_OPERATOR clearance)
  const currentSimulatorRole = StaffRole.TOC_OPERATOR;

  // Fully defined operational navigation groups
  const navigationGroups: NavigationGroup[] = [
    {
      id: "match-venue-ops",
      title: "Match & Venue Operations",
      items: [
        {
          id: "dashboard",
          label: "Operations Dashboard",
          icon: "LayoutDashboard",
          badgeCount: 2,
          badgeVariant: "info"
        },
        {
          id: "map",
          label: "Stadium Gate Layout",
          icon: "Map"
        }
      ]
    },
    {
      id: "incidents-coordination",
      title: "Response & Support",
      items: [
        {
          id: "incidents",
          label: "Incident Registry",
          icon: "AlertTriangle",
          badgeCount: 5,
          badgeVariant: "critical"
        },
        {
          id: "telemetry",
          label: "Crowd Flow Ingress",
          icon: "Activity",
          badgeCount: 0
        }
      ]
    },
    {
      id: "console-admin",
      title: "Administration & System",
      items: [
        {
          id: "diagnostics",
          label: "Engineering Diagnostics",
          icon: "Radio"
        },
        {
          id: "settings",
          label: "Console Settings",
          icon: "Settings"
        }
      ]
    }
  ];

  // Map icon strings to actual Lucide component instances
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-[18px] h-[18px] shrink-0" };
    switch (iconName) {
      case "LayoutDashboard": return <LayoutDashboard {...iconProps} />;
      case "AlertTriangle": return <AlertTriangle {...iconProps} />;
      case "Map": return <Map {...iconProps} />;
      case "Activity": return <Activity {...iconProps} />;
      case "Users": return <Users {...iconProps} />;
      case "Radio": return <Radio {...iconProps} />;
      case "FileSpreadsheet": return <FileSpreadsheet {...iconProps} />;
      case "Settings": return <Settings {...iconProps} />;
      default: return <LayoutDashboard {...iconProps} />;
    }
  };

  const handleNavClick = (id: string) => {
    setActiveNavId(id);
  };

  // Immediate Level-1 Emergency Protocol switch
  const triggerEmergencyBroadcast = () => {
    setTheme("emergency");
  };

  return (
    <aside
      className={cn(
        "bg-surface border-r border-border h-[calc(100vh-64px)] flex flex-col justify-between sticky top-[64px] z-30 transition-all duration-normal ease-smooth shadow-medium",
        isSidebarCollapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
      aria-label="Primary Navigation System"
      id="side-nav-hud"
      {...props}
    >
      {/* Scrollable Navigation Groups Wrapper */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-sm py-md space-y-xl" id="side-nav-groups-wrapper">
        
        {navigationGroups.map((group) => (
          <div key={group.id} className="space-y-sm" id={`sidebar-group-${group.id}`}>
            {/* Group Label */}
            {!isSidebarCollapsed && (
              <h3 className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest px-md pt-xs pb-1xs border-l border-border/50">
                {group.title}
              </h3>
            )}

            {/* Group Items */}
            <nav className="space-y-[4px]" aria-label={group.title} id={`nav-group-container-${group.id}`}>
              {group.items.map((item) => {
                const isSelected = activeNavId === item.id;
                
                // Role Clearance Authorization Logic
                const hasRoleClearance = item.requiredRoles 
                  ? item.requiredRoles.includes(currentSimulatorRole)
                  : true;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex items-center tracking-normal text-left cursor-pointer transition-all duration-fast font-display font-medium focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 relative",
                      isSidebarCollapsed
                        ? "w-10 h-10 justify-center rounded-md mx-auto"
                        : "w-full gap-3 px-3.5 py-2.5 rounded-md text-xs",
                      isSelected
                        ? isSidebarCollapsed
                          ? "bg-primary/10 text-primary font-semibold shadow-sm"
                          : "bg-primary/10 text-primary font-semibold pl-[13px] border-l-[3px] border-primary"
                        : isSidebarCollapsed
                          ? "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary pl-4 border-l-[3px] border-transparent",
                      !hasRoleClearance && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-text-secondary"
                    )}
                    aria-pressed={isSelected}
                    aria-disabled={!hasRoleClearance ? "true" : undefined}
                    title={!hasRoleClearance ? "Access Restricted: Security Clearance Required" : item.label}
                    id={`sidebar-item-btn-${item.id}`}
                  >
                    {/* Item Icon */}
                    <div className={cn(
                      "flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "text-primary" : "text-text-secondary"
                    )}>
                      {renderIcon(item.icon)}
                    </div>

                    {/* Item Label (Hidden when collapsed) */}
                    {!isSidebarCollapsed && (
                      <span className="flex-1 font-semibold truncate" id={`sidebar-label-text-${item.id}`}>
                        {item.label}
                      </span>
                    )}

                    {/* Restrict Lock Cues */}
                    {!hasRoleClearance && !isSidebarCollapsed && (
                      <Lock className="w-3 h-3 text-text-muted ml-xs shrink-0" aria-hidden="true" />
                    )}

                    {/* Operational Alert Count Badges (Hidden when collapsed unless critical status) */}
                    {item.badgeCount && item.badgeCount > 0 && (!isSidebarCollapsed || item.badgeVariant === "critical") && (
                      <Badge 
                        variant={item.badgeVariant || "neutral"} 
                        size="sm"
                        className={cn(
                          "shrink-0 transition-all",
                          isSidebarCollapsed ? "absolute -top-1xs -right-1xs scale-[0.8]" : ""
                        )}
                        id={`sidebar-badge-${item.id}`}
                      >
                        {item.badgeCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Area: Expand Control + LEVEL-1 EMERGENCY TRIGGER BUTTON */}
      <div className="p-sm border-t border-border bg-background/25 space-y-sm shrink-0" id="sidebar-footer-controls">
        
        {/* Emergency Response Mock Broadcast Panel */}
        {!isSidebarCollapsed ? (
          <div className="bg-error/5 border border-error/20 rounded-md p-3 text-left shadow-sm animate-fade-in-slide" id="failsafe-emergency-box">
            <div className="flex items-start gap-xs">
              <ShieldAlert className="w-4 h-4 text-error shrink-0 animate-pulse-gentle mt-[2px]" aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <span className="block font-mono text-[9px] font-bold text-error uppercase tracking-wider">
                  Emergency Protocol
                </span>
                <p className="text-[10px] leading-normal text-text-secondary">
                  Simulate live broadcast alert dispatches to spectator services.
                </p>
                <button
                  onClick={triggerEmergencyBroadcast}
                  className="mt-1.5 px-2 py-1 bg-error text-error-fg hover:bg-error/95 font-mono text-[9px] font-bold rounded-md uppercase tracking-wider w-full text-center cursor-pointer transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 shadow-sm"
                  id="failsafe-trigger-btn"
                >
                  TRIGGER EMERGENCY
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={triggerEmergencyBroadcast}
            className="w-full flex items-center justify-center p-2 bg-error/10 hover:bg-error text-error hover:text-error-fg border border-error/20 hover:border-transparent rounded-md cursor-pointer transition-all duration-fast focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0"
            title="SIMULATE MATCH-DAY EMERGENCY RESPONSE PROTOCOLS"
            id="failsafe-collapsed-btn"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse-gentle" aria-hidden="true" />
          </button>
        )}

        {/* Manual Expand / Collapse Control Row */}
        <div className="flex justify-end" id="sidebar-expand-toggle-row">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer w-full flex items-center justify-center"
            aria-label={isSidebarCollapsed ? "Expand sidebar layout panel" : "Collapse sidebar layout panel"}
            id="side-nav-manual-collapse-btn"
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <div className="flex items-center gap-xs text-xs font-mono uppercase font-semibold">
                <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
                <span>COLLAPSE NAV</span>
              </div>
            )}
          </button>
        </div>

      </div>
    </aside>
  );
};
