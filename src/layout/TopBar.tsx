/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { 
  Menu, 
  Search, 
  MapPin, 
  Wifi, 
  Activity, 
  Bell, 
  Globe, 
  User, 
  Sun, 
  Moon, 
  ShieldAlert,
  ChevronDown,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { cn } from "@/src/utils/classnames";
import { useShell } from "./ShellProvider";
import { ThemeType } from "../types/layout";
import { useCollaboration } from "../context/CollaborationContext";

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TopBar: React.FC<TopBarProps> = ({ className, ...props }) => {
  const { 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    theme,
    setTheme,
    currentVenue,
    currentMatch,
    preferences
  } = useShell();

  const { connectionStatus, toggleNetworkState } = useCollaboration();

  const [time, setTime] = React.useState("22:38:15");
  const [showSearchFocus, setShowSearchFocus] = React.useState(false);

  // Sync real live clock or standard UTC time
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleThemeToggle = () => {
    const themes: ThemeType[] = ["default", "light", "high-contrast", "emergency"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <header
      className={cn(
        "h-[64px] bg-surface border-b border-border px-md md:px-lg flex items-center justify-between gap-md sticky top-0 z-40 transition-colors duration-normal ease-smooth shadow-low",
        className
      )}
      role="banner"
      id="top-bar-hud"
      {...props}
    >
      {/* 1. Brand Logo / Hamburger Control */}
      <div className="flex items-center gap-xs" id="top-bar-brand-group">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-sm text-text-primary hover:bg-surface-hover hover:text-primary rounded-sm transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer"
          aria-label={isSidebarCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          aria-expanded={!isSidebarCollapsed}
          id="sidebar-toggle-btn"
        >
          <Menu className="w-md h-md" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1xs select-none hidden sm:flex" id="top-bar-brand">
          <Globe className="w-lg h-lg text-primary animate-pulse-gentle" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-text-secondary uppercase">
            FIFA TOC
          </span>
        </div>
      </div>

      {/* 2. Global Tactical Search */}
      <div className="flex-1 max-w-md relative hidden md:block" id="top-bar-search-group">
        <div className={cn(
          "absolute left-sm top-1/2 -translate-y-1/2 transition-colors",
          showSearchFocus ? "text-primary" : "text-text-muted"
        )}>
          <Search className="w-4 h-4" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Search tournament, gates, active dispatches..."
          aria-label="Global System Search"
          onFocus={() => setShowSearchFocus(true)}
          onBlur={() => setShowSearchFocus(false)}
          className="w-full bg-background/50 border border-border rounded-md pl-xl pr-md py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:bg-background transition-all duration-fast"
          id="global-hud-search"
        />
      </div>

      {/* 3. Operational HUD State Telemetries */}
      <div className="flex items-center gap-sm lg:gap-md" id="top-bar-hud-elements">
        {/* Match Tracker */}
        <div className="bg-background/40 border border-border/60 rounded-md px-sm py-1 hidden lg:flex flex-col text-left select-none max-w-[200px]" id="hud-match-tracker">
          <span className="font-mono text-[9px] text-text-muted uppercase">Active Match Context</span>
          <span className="text-[11px] font-bold text-text-primary truncate" title={currentMatch}>
            {currentMatch}
          </span>
        </div>

        {/* Venue Tracker */}
        <div className="bg-background/40 border border-border/60 rounded-md px-sm py-1 hidden lg:flex flex-col text-left select-none max-w-[180px]" id="hud-venue-tracker">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-secondary" aria-hidden="true" />
            <span className="font-mono text-[9px] text-text-muted uppercase">Venue Node</span>
          </div>
          <span className="text-[11px] font-semibold text-text-secondary truncate" title={currentVenue}>
            {currentVenue}
          </span>
        </div>

        {/* Live Multi-Zone Clock HUD */}
        <div className="bg-background/60 border border-border rounded-md px-sm py-1 flex items-center gap-xs shadow-inner" id="hud-live-clock">
          <span className="relative flex h-2 w-2" id="live-indicator-dot">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <div className="font-mono text-xs text-text-secondary select-none">
            <span className="text-text-muted uppercase">UTC </span>
            <span className="text-text-primary font-bold tracking-wider">{time}</span>
          </div>
        </div>

        {/* System Health Indicators */}
        {preferences.showSystemHealth && (
          <div className="flex items-center gap-xs" id="system-health-indicators">
            {/* Health */}
            <div 
              className="flex items-center gap-1.5 border border-success/30 bg-success/5 rounded-md px-1.5 py-0.5 text-[11px] font-mono text-secondary hidden sm:flex select-none"
              title="All Node Engines nominal"
            >
              <Activity className="w-[14px] h-[14px] text-secondary" aria-hidden="true" />
              <span>SYS OK</span>
            </div>

            {/* Connection Status */}
            {connectionStatus === "connected" && (
              <button 
                onClick={toggleNetworkState}
                className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 rounded-md px-1.5 py-0.5 text-[11px] font-mono text-primary hidden sm:flex select-none cursor-pointer hover:bg-primary/10 transition-colors"
                title="Active collaborative session. Click to simulate network outage."
                id="top-bar-connection-active"
              >
                <Wifi className="w-[14px] h-[14px] text-primary" aria-hidden="true" />
                <span>ONLINE</span>
              </button>
            )}
            {connectionStatus === "reconnecting" && (
              <button 
                onClick={toggleNetworkState}
                className="flex items-center gap-1.5 border border-warning/30 bg-warning/5 rounded-md px-1.5 py-0.5 text-[11px] font-mono text-warning hidden sm:flex select-none cursor-pointer hover:bg-warning/10 transition-colors"
                title="Attempting connection recovery. Click to abort."
                id="top-bar-connection-syncing"
              >
                <RefreshCw className="w-[14px] h-[14px] text-warning animate-spin" aria-hidden="true" />
                <span>SYNCING</span>
              </button>
            )}
            {connectionStatus === "disconnected" && (
              <button 
                onClick={toggleNetworkState}
                className="flex items-center gap-1.5 border border-error/30 bg-error/5 rounded-md px-1.5 py-0.5 text-[11px] font-mono text-error hidden sm:flex select-none cursor-pointer hover:bg-error/10 transition-colors animate-pulse-gentle"
                title="Operational channel offline. Click to restore connection."
                id="top-bar-connection-offline"
              >
                <WifiOff className="w-[14px] h-[14px] text-error" aria-hidden="true" />
                <span>OFFLINE</span>
              </button>
            )}
          </div>
        )}

        <hr className="h-6 w-[1px] border-l border-border hidden sm:block" />

        {/* 4. Controls: Notifications, Switchers & Profiling */}
        <div className="flex items-center gap-xs" id="top-bar-controls">
          {/* Theme switcher */}
          <button
            onClick={handleThemeToggle}
            className="p-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer relative"
            aria-label={`Change theme template. Active theme: ${theme}`}
            id="theme-quick-toggler"
          >
            {theme === "light" ? (
              <Moon className="w-md h-md" aria-hidden="true" />
            ) : (
              <Sun className="w-md h-md" aria-hidden="true" />
            )}
            <span className="absolute -top-1xs -right-1xs bg-primary text-[8px] font-bold font-mono px-1xs text-primary-fg rounded-md uppercase scale-90">
              {theme === "default" ? "LGT" : theme === "light" ? "DRK" : theme === "high-contrast" ? "A11y" : "EMG"}
            </span>
          </button>

          {/* Notifications Trigger */}
          <button
            className="p-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer relative"
            aria-label="3 Unread Broadcast Notifications"
            id="notifications-trigger-btn"
          >
            <Bell className="w-md h-md" aria-hidden="true" />
            <span className="absolute top-2xs right-2xs w-2 h-2 bg-error rounded-full" aria-hidden="true" />
          </button>

          {/* Language Switcher */}
          <button
            className="p-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer hidden md:flex items-center gap-2xs"
            aria-label="Change System Language (English active)"
            id="language-switcher-btn"
          >
            <Globe className="w-md h-md" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase">EN</span>
            <ChevronDown className="w-3 h-3 text-text-muted" aria-hidden="true" />
          </button>

          <hr className="h-6 w-[1px] border-l border-border" />

          {/* User Profile */}
          <button
            className="flex items-center gap-xs p-1xs hover:bg-surface-hover border border-transparent hover:border-border rounded-md transition-all duration-fast focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 cursor-pointer text-left"
            aria-label="User Profile menu. Active session: Operator shriyanshisinha@gmail.com"
            id="user-profile-menu-btn"
          >
            <div className="w-lg h-lg rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-mono text-xs font-bold select-none shrink-0" id="user-avatar-initials">
              S
            </div>
            <div className="hidden lg:flex flex-col text-left" id="user-profile-text">
              <span className="text-[11px] font-bold text-text-primary leading-tight">S. Sinha</span>
              <span className="text-[9px] font-mono text-text-secondary uppercase">TOC Operator</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
