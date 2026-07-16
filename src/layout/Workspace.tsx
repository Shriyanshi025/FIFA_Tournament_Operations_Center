/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeader } from "./PageHeader";
import { useShell } from "./ShellProvider";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { TrendingUp, X } from "lucide-react";

export interface WorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main page header title
   */
  title: string;
  /**
   * Support explanation description for page header
   */
  description?: string;
  /**
   * Action components (buttons, links) displayed in header row
   */
  actions?: React.ReactNode;
  /**
   * Custom breadcrumb override. If omitted, default breadcrumbs corresponding 
   * to active navigation ID are generated.
   */
  breadcrumbs?: React.ReactNode;
  /**
   * Additional right sidebar panel content (e.g. detailed sensors telemetry)
   */
  rightSidebar?: React.ReactNode;
  /**
   * Operations panel override. If omitted, standard reactive tournament assistance panel is shown.
   */
  copilotPanel?: React.ReactNode;
}

/**
 * Workspace Container organizing Page headers, Breadcrumbs, Main layout nodes,
 * and auxiliary panel setups (such as the Tournament Assistant integration).
 */
export const Workspace: React.FC<WorkspaceProps> = ({
  className,
  title,
  description,
  actions,
  breadcrumbs,
  rightSidebar,
  copilotPanel,
  children,
  ...props
}) => {
  const { preferences, setPreferences } = useShell();

  const handleCloseCopilot = () => {
    setPreferences((prev) => ({ ...prev, showCopilotPanel: false }));
  };

  return (
    <div
      className={cn(
        "flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden transition-colors duration-normal ease-smooth",
        className
      )}
      id="workspace-layout-root"
      {...props}
    >
      {/* A. MAIN CONTENT AREA */}
      <main
        className="flex-1 overflow-y-auto scrollbar-thin p-md md:p-lg flex flex-col min-w-0"
        tabIndex={-1}
        id="main-workspace-scroll-container"
      >
        {/* Breadcrumb Row */}
        <div className="mb-2xs shrink-0" id="breadcrumbs-row">
          {breadcrumbs || <Breadcrumbs />}
        </div>

        {/* Page Header Component */}
        <PageHeader 
          title={title} 
          description={description} 
          actions={actions} 
          className="shrink-0"
          id="workspace-page-header"
        />

        {/* Actual Screen Layout Content */}
        <div className="flex-1 flex flex-col gap-md" id="workspace-main-content">
          {children}
        </div>
      </main>

      {/* B. OPTIONAL INTEGRAL RIGHT SIDEBAR (Telemetry Details etc) */}
      {rightSidebar && (
        <aside
          className="w-full lg:w-[320px] bg-surface border-t lg:border-t-0 lg:border-l border-border overflow-y-auto scrollbar-thin p-md md:p-lg shrink-0 transition-colors duration-normal shadow-low"
          aria-label="Auxiliary Operational Telemetry Diagnostics"
          id="workspace-right-sidebar"
        >
          <div className="space-y-md">
            {rightSidebar}
          </div>
        </aside>
      )}

      {/* C. SECONDARY AUXILIARY PANEL: TOURNAMENT ASSISTANT FEED */}
      {preferences.showCopilotPanel && (
        <aside
          className="w-full lg:w-[360px] bg-surface border-t lg:border-t-0 lg:border-l border-border overflow-y-auto scrollbar-thin flex flex-col shrink-0 shadow-high transition-all duration-normal ease-smooth"
          aria-label="Tournament Recommendation Feed"
          id="workspace-copilot-port"
        >
          {copilotPanel || (
            <div className="flex flex-col h-full" id="default-copilot-panel">
              {/* Copilot Header */}
              <div className="p-lg border-b border-border flex items-center justify-between bg-primary/5 select-none" id="copilot-panel-header">
                <div className="flex items-center gap-xs">
                  <TrendingUp className="w-md h-md text-primary animate-pulse-gentle" aria-hidden="true" />
                  <div>
                    <h3 className="font-display font-semibold text-body-base text-text-primary">Tournament Assistant</h3>
                    <p className="text-[10px] font-mono text-text-secondary uppercase">Operations Recommendation Support</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCopilot}
                  className="p-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0"
                  aria-label="Close Recommendations Panel"
                  id="copilot-close-btn"
                >
                  <X className="w-md h-md" aria-hidden="true" />
                </button>
              </div>

              {/* Copilot Log Body */}
              <div className="flex-1 p-lg space-y-md text-left overflow-y-auto" id="copilot-logs-body">
                <div className="space-y-sm">
                  <span className="font-mono text-[10px] font-bold text-primary tracking-wider uppercase block">
                    Situation Assessment
                  </span>
                  
                  {/* Premium SaaS Recommendation Card */}
                  <Card shadow="medium" className="p-md space-y-md border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2xs py-[2px] bg-primary/10 text-primary rounded-xs">
                        REC-2026-08
                      </span>
                      <div className="flex items-center gap-1xs font-mono text-[10px]">
                        <span className="text-text-secondary">Confidence:</span>
                        <span className="font-bold text-secondary">94%</span>
                      </div>
                    </div>

                    <div className="space-y-sm text-caption">
                      <div>
                        <h4 className="font-bold text-text-primary">Reason</h4>
                        <p className="text-text-secondary leading-relaxed mt-[2px]">
                          Spectator throughput Spike at Southwest Turnstiles Gate G-4 during peak ingress window.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-text-primary">Evidence</h4>
                        <div className="mt-[2px] space-y-[2px] font-mono text-[10px] text-text-secondary bg-background/55 p-2xs border border-border/40 rounded-xs">
                          <div>• Flow: 420 fans/min (Threshold: 350)</div>
                          <div>• Queues: Average waiting time &gt; 12 mins</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-text-primary">Recommended Action</h4>
                        <p className="text-text-secondary leading-relaxed mt-[2px]">
                          Instruct Sector Leader to activate auxiliary gate channels G-5 &amp; G-6 and redeploy volunteer teams to guide spectator flow.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-text-primary">Expected Outcome</h4>
                        <p className="text-text-secondary leading-relaxed mt-[2px]">
                          Reduces waiting times below 5 minutes and redistributes pressure across the southwest entry point.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="border border-border/60 rounded-xs p-sm bg-background/40 text-caption text-text-secondary leading-relaxed space-y-xs">
                  <p>
                    The Stadium Assistant continuously evaluates crowd sensors, gate counts, and dispatch queues.
                  </p>
                  <p className="font-mono text-[9px] bg-background/60 p-xs border border-border/40 rounded-xs text-text-muted">
                    No further high-priority anomalies detected. Standby active.
                  </p>
                </div>
              </div>

              {/* Copilot Quick Prompt Input */}
              <div className="p-md border-t border-border bg-background/20" id="copilot-input-area">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search operations analytics database..."
                    disabled
                    className="w-full bg-background border border-border rounded-md px-sm py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none cursor-not-allowed opacity-60"
                    id="copilot-mock-input"
                  />
                </div>
                <span className="block text-[9px] font-mono text-text-muted mt-xs text-center">
                  Insight queries frozen until Phase 2
                </span>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
