import * as React from "react";
import { Sparkles } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";

export function ScenarioGuidanceDialog() {
  const { simulationEngineState } = useTournament();
  const [isScenarioGuideDismissed, setIsScenarioGuideDismissed] = React.useState(false);
  const prevActiveScenarioId = React.useRef<string | null>(null);

  React.useEffect(() => {
    const activeId = simulationEngineState?.activeScenarioId;
    if (activeId && activeId !== "SC-NORMAL" && activeId !== prevActiveScenarioId.current) {
      setIsScenarioGuideDismissed(false);
    }
    prevActiveScenarioId.current = activeId || null;
  }, [simulationEngineState?.activeScenarioId]);

  const activeScenId = simulationEngineState?.activeScenarioId;
  if (!activeScenId || activeScenId === "SC-NORMAL" || isScenarioGuideDismissed) return null;

  let title = "Operational Scenario Guided Walkthrough";
  let description = "An event has been injected into the live simulation.";
  let observationPoints = [
    "Observe live ingress drop inside transit widgets.",
    "Check the newly logged incident with SLA countdown ticking.",
    "Expand recommendation center to evaluate calibrated LLM confidence, retrieved SOP rules, and estimated CO2 offsets."
  ];

  if (activeScenId === "SC-STRIKE") {
    title = "Active Scenario: Metro Transit Interruption";
    description = "Grid infrastructure downtime has suspended transit trains on lines A & B, causing huge pedestrian queues outside sector terminals.";
    observationPoints = [
      "Observe the instantaneous drop in Metro throughput under Logistic widgets.",
      "Verify the color-progressive SLA timer ticking on the open METRO incident in Incident Registry.",
      "Inspect the Copilot recommendation for shuttle dispatching, including grounding SOP excerpts and metrics predictions."
    ];
  } else if (activeScenId === "SC-SOLD-OUT") {
    title = "Active Scenario: Ingress Crowd Surge";
    description = "Match ticket gates are experiencing record crowds (exceeding 6 people/m²), triggering safety hazard alerts.";
    observationPoints = [
      "Monitor red warning markers flickering on the Live Crowd Heatmap.",
      "Look for safety alerts and the corresponding SLA response timeline under Incident Center.",
      "Expand the AI Dispatch recommendation card to audit the retrieved SOP titled 'FIFA Crowd Density Protocol'."
    ];
  } else if (activeScenId === "SC-HEAT") {
    title = "Active Scenario: Thermal Ingress Emergency";
    description = "Temperatures inside Section 112 have escalated to 39.5°C, requiring dynamic shade allocation and emergency hydration dispatches.";
    observationPoints = [
      "Check environmental counters spiking on the Weather and Health logs.",
      "Look for the hydration center dispatch recommendations formulated by Gemini.",
      "Click on the prediction impact preview showing estimated water distribution throughputs."
    ];
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9997] w-[380px] bg-surface border-2 border-primary shadow-2xl rounded-md p-md space-y-sm text-left animate-slide-up"
      id="scenario-guidance-overlay"
    >
      <div className="flex justify-between items-start border-b border-border pb-xs">
        <div className="flex items-center gap-xs">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse-gentle" />
          <h4 className="font-display font-bold text-caption text-text-primary">{title}</h4>
        </div>
        <button 
          onClick={() => setIsScenarioGuideDismissed(true)} 
          className="text-text-muted hover:text-text-primary cursor-pointer font-bold font-mono text-xs"
          title="Dismiss Guidance"
        >
          ✕
        </button>
      </div>
      <p className="text-caption text-text-secondary leading-normal">{description}</p>
      <div className="space-y-xs pt-xs">
        <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider block">🏆 Observer Evaluation Guide:</span>
        <ul className="space-y-xs">
          {observationPoints.map((pt, i) => (
            <li key={i} className="flex gap-xs items-start text-[10px] text-text-secondary leading-normal">
              <span className="text-primary font-bold">{i+1}.</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end pt-xs border-t border-border/40">
        <span className="text-text-muted">Target SLA: <strong>900s</strong></span>
        <button 
          onClick={() => setIsScenarioGuideDismissed(true)}
          className="text-primary hover:underline font-bold cursor-pointer ml-auto"
        >
          Understood, Dismiss
        </button>
      </div>
    </div>
  );
}
