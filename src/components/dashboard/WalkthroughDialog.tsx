import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../index";

interface WalkthroughDialogProps {
  walkthroughStep: number;
  setWalkthroughStep: React.Dispatch<React.SetStateAction<number | null>>;
}

export function WalkthroughDialog({ walkthroughStep, setWalkthroughStep }: WalkthroughDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[99999]" id="judge-tour-dialog">
          <div className="bg-surface border-2 border-primary max-w-md w-full rounded-md shadow-2xl p-lg text-left space-y-md text-text-primary m-md relative">
            
            {/* Steps tracker header */}
            <div className="flex justify-between items-center border-b border-border/80 pb-xs">
              <div className="flex items-center gap-xs">
                <Sparkles className="w-4 h-4 text-secondary animate-pulse-gentle" />
                <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider">
                  🏆 Stadium Operations Tour • Step {walkthroughStep} of 5
                </span>
              </div>
              <button 
                onClick={() => setWalkthroughStep(null)} 
                className="text-text-muted hover:text-text-primary font-bold cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Step content switch */}
            {walkthroughStep === 1 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">1. Deploy a Live Scenario Event</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Start the tournament simulation by selecting a scenario in the **One-Click Live Scenarios** grid (e.g. **Metro Failure** or **Crowd Surge**). This simulates emergency sensors, crowd telemetry logs, and triggers the AI agent pipeline immediately.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The system clock starts ticking and live environmental feeds load dynamically.
                </div>
              </div>
            )}

            {walkthroughStep === 2 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">2. Track Live Ingress & Incident SLAs</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Navigate to the **Incidents & Teams** sub-tab. Notice the newly registered incident with its real-time color-progressive **SLA Countdown Timer** ticking. The timer changes from green to warning orange and flashing red as limits approach.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The system also prints predicted resolution timings (e.g., "Est. Resolve: 2.5m") for optimal operators.
                </div>
              </div>
            )}

            {walkthroughStep === 3 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">3. Inspect Explainable AI Center</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Go to the **AI Copilot** sub-tab. Expand any generated recommendation to view our **Explainable AI (XAI) Panel**. Review the model confidence gauges, retrieved SOP collection titles, excerpts, and predictive impact matrices (Wait times, CO2 offset, Dispatch speed).
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: Predictions provide physical metrics, e.g. "CO₂ Offset: -140kg", showing sustainable load balancing.
                </div>
              </div>
            )}

            {walkthroughStep === 4 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">4. Execute Human Overrides & Dispatch</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Click **Approve Operational Intervention** on the recommendation card. This models real-world human-in-the-loop validation, resolving the underlying incident instantly, deploying the units, and logging the action.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The active incident's status moves directly to "RESOLVED" and the SLA timer locks on "SLA Met".
                </div>
              </div>
            )}

            {walkthroughStep === 5 && (
              <div className="space-y-sm">
                <h4 className="font-display font-bold text-body-lg text-text-primary">5. Review Cryptographic Audit Ledger</h4>
                <p className="text-caption text-text-secondary leading-relaxed">
                  Finally, go to the **Settings & Logs** tab and scroll to the bottom. Here, our **AI Audit Timeline** logs every prompt version, execution latency, adapter, and correlation ID in a connected vertical graph for enterprise accountability.
                </p>
                <div className="p-xs bg-background/50 border border-dashed rounded-xs text-[10px] font-mono text-text-muted">
                  Observe: The logs are cryptographically stamped, proving full operations center compliance.
                </div>
              </div>
            )}

            {/* Navigation footer */}
            <div className="flex justify-between items-center pt-md border-t border-border/60">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWalkthroughStep((prev: number | null) => prev === 1 ? null : prev! - 1)}
                disabled={walkthroughStep === 1}
                className="font-mono text-[10px] font-bold"
              >
                ◀ Back
              </Button>

              <div className="flex items-center gap-xs">
                <button 
                  onClick={() => setWalkthroughStep(null)} 
                  className="text-text-muted hover:text-text-primary font-mono text-[10px] px-sm font-bold cursor-pointer"
                >
                  Skip Tour
                </button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    if (walkthroughStep === 5) {
                      setWalkthroughStep(null);
                    } else {
                      setWalkthroughStep((prev: number | null) => prev! + 1);
                    }
                  }}
                  className="font-mono text-[10px] font-bold"
                >
                  {walkthroughStep === 5 ? "Finish Tour 🎉" : "Next Step ▶"}
                </Button>
              </div>
            </div>

          </div>
        </div>
  );
}