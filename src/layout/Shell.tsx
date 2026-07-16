/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useShell } from "./ShellProvider";

export interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Main Application Shell integrating Skip navigation, Header HUD, 
 * Left Navigation system, and dynamic Content Viewports.
 */
export const Shell: React.FC<ShellProps> = ({ className, children, ...props }) => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useShell();

  // Handle auto-collapse sidebar on smaller tablet screens automatically
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check on mount
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarCollapsed]);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-text-primary flex flex-col font-sans antialiased selection:bg-selection-bg selection:text-selection-text transition-colors duration-normal ease-smooth",
        className
      )}
      id="nexus-application-shell-root"
      {...props}
    >
      {/* 1. Skip To Main Content (WAI-ARIA Accessibility focus pattern) */}
      <a
        href="#main-workspace-scroll-container"
        className="sr-only focus:not-sr-only focus:absolute focus:top-sm focus:left-sm bg-primary text-primary-fg px-md py-xs rounded-sm font-mono text-xs font-bold tracking-wider z-50 shadow-high outline-none ring-3 ring-focus"
        id="skip-to-content-anchor"
      >
        SKIP TO MAIN CONTENT
      </a>

      {/* 2. Top Navigation (Banner Landmark) */}
      <TopBar id="app-shell-topbar" />

      {/* 3. Main Workspace Row (Sidebar & Content Area) */}
      <div className="flex-1 flex min-h-0 relative" id="app-shell-main-row">
        
        {/* Navigation Sidebar (Complementary Landmark) */}
        <Sidebar id="app-shell-sidebar" />

        {/* Dynamic Workspace Container (Main Landmark handled within workspace children) */}
        <div 
          className="flex-1 flex flex-col min-w-0 h-[calc(100vh-64px)] relative bg-background"
          id="app-shell-content-viewport"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
