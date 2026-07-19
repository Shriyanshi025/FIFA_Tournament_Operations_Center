/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from "react";
import { Compass, Sparkles, AlertCircle, FileText } from "lucide-react";
import { useTournament } from "../../../context/TournamentContext";

interface NodePosition {
  id: string;
  title: string;
  x: number;
  y: number;
  tags: string[];
}

export const SemanticProximityVisualizer: React.FC = () => {
  const { recommendations } = useTournament();
  
  // High-contrast coordinates positioning seeded SOPs in a 2D Semantic Space
  const sopNodes: NodePosition[] = [
    { id: "sop-fifa-match-postponement", title: "FIFA Match Postponement SOP", x: 15, y: 70, tags: ["Hazard", "Weather"] },
    { id: "sop-emergency-fire-containment", title: "Structural Fire response SOP", x: 25, y: 20, tags: ["Fire", "Emergency"] },
    { id: "sop-medical-cardiac-triage", title: "Mass Cardiac Triage SOP", x: 80, y: 30, tags: ["Medical", "Dehydration"] },
    { id: "sop-security-perimeter-breach", title: "Gate Isolation breach SOP", x: 75, y: 80, tags: ["Breach", "Security"] },
    { id: "sop-crowd-density-balancing", title: "Crowd Flow Load Balancing SOP", x: 50, y: 55, tags: ["Turnstiles", "Congestion"] }
  ];

  // Retrieve active selected target RAG nodes from latest recommendations
  const activeSOPDetails = React.useMemo(() => {
    const latestRec = recommendations[0];
    if (!latestRec) return null;
    const sources = (latestRec as any).explanation?.knowledgeSourcesUsed || [];
    return {
      recId: latestRec.id,
      title: latestRec.title,
      groundedIds: sources as string[],
      confidence: latestRec.confidenceScore
    };
  }, [recommendations]);

  // Canvas draw logic simulating live vector projection updates
  return (
    <div className="border p-md bg-surface rounded-md shadow-low text-left space-y-md" id="semantic-space-visualizer">
      <div className="flex items-center justify-between pb-xs border-b border-border/40">
        <div className="flex items-center gap-xs">
          <Compass className="w-5 h-5 text-primary animate-spin-slow" />
          <h4 className="font-display font-semibold text-caption text-text-primary">Cognitive Semantic Space Mapping Overlay</h4>
        </div>
        <span className="font-mono text-[9px] bg-primary/10 text-primary px-2xs py-[2px] rounded-xs font-bold uppercase">
          Live Vector Embeddings
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        
        {/* Semantic Coordinate Mapping Plot (2/3 Width) */}
        <div className="lg:col-span-2 relative h-[260px] bg-background/50 border rounded-sm overflow-hidden flex items-center justify-center">
          
          {/* Background grid canvas mesh */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(ellipse_at_center,_var(--color-neutral)_1px,_transparent_1px)] bg-[size:16px_16px]" />

          {/* Render Vector Nodes */}
          {sopNodes.map(node => {
            const isGrounded = activeSOPDetails?.groundedIds.includes(node.id);
            return (
              <div 
                key={node.id} 
                className="absolute transition-all duration-500 group"
                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div 
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isGrounded 
                      ? "bg-primary border-primary shadow-[0_0_12px_rgba(37,99,235,0.6)] scale-110" 
                      : "bg-surface border-border group-hover:border-neutral group-hover:scale-105"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isGrounded ? "bg-white" : "bg-text-muted group-hover:bg-neutral"}`} />
                </div>

                {/* Node Metadata Label Tooltip */}
                <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-surface/90 backdrop-blur-xs border px-xs py-[2px] rounded-xs font-mono text-[8px] whitespace-nowrap opacity-75 group-hover:opacity-100 transition-opacity z-10">
                  <span className={isGrounded ? "text-primary font-bold" : "text-text-secondary"}>{node.title}</span>
                </div>
              </div>
            );
          })}

          {/* Render Active Incident Query Vector Node */}
          {activeSOPDetails && (
            <div 
              className="absolute transition-all duration-500 flex flex-col items-center"
              style={{ left: "50%", top: "30%", transform: "translate(-50%, -50%)" }}
            >
              {/* Dynamic Connecting Laser Lines to matching SOP nodes */}
              {sopNodes.map(node => {
                const isGrounded = activeSOPDetails.groundedIds.includes(node.id);
                if (!isGrounded) return null;

                // Simple calculated slope/distance mapping for visual SVG lines
                const deltaX = node.x - 50;
                const deltaY = node.y - 30;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

                return (
                  <div 
                    key={`line-${node.id}`}
                    className="absolute bg-gradient-to-r from-error/60 to-primary/40 h-[1.5px] origin-left animate-pulse"
                    style={{
                      left: 0,
                      top: 8,
                      width: `${distance * 3.4}px`,
                      transform: `rotate(${angle}deg)`
                    }}
                  />
                );
              })}

              <div className="w-5 h-5 rounded-full bg-error border border-error flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse z-10">
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-error/10 border border-error/25 text-error px-2xs py-[2px] rounded-xs font-mono text-[8px] font-bold whitespace-nowrap mt-xs z-10">
                Active Ingress Alert Event Vector
              </div>
            </div>
          )}
        </div>

        {/* Vector Metrics Sidebar Info (1/3 Width) */}
        <div className="space-y-sm font-sans text-caption text-text-secondary leading-normal">
          <p>
            Stadium Nexus plots incoming telemetry incidents against standard operations manuals to find vector intersections:
          </p>
          {activeSOPDetails ? (
            <div className="p-xs bg-background/50 border rounded-sm space-y-xs">
              <span className="font-mono text-[9px] text-text-muted uppercase block">Semantic Projection Insight</span>
              <div className="font-mono text-[10px] font-bold text-text-primary flex items-center gap-2xs">
                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse-gentle" />
                Query Vector Resolved: {activeSOPDetails.recId}
              </div>
              <div className="text-[10px] text-text-secondary leading-normal mt-2xs">
                Matches: <strong className="text-primary font-mono">{activeSOPDetails.groundedIds.join(", ").toUpperCase()}</strong>
              </div>
              <div className="text-[10px] text-text-secondary font-mono leading-normal">
                Cosine Similarity: <strong className="text-success">{(activeSOPDetails.confidence * 100).toFixed(1)}%</strong>
              </div>
            </div>
          ) : (
            <div className="p-sm bg-background/30 border border-dashed rounded-sm text-center font-mono text-[9px] text-text-muted">
              System nominal. Monitoring semantic query bus...
            </div>
          )}

          <div className="flex items-start gap-xs bg-background/40 p-xs border border-border/60 rounded-xs">
            <FileText className="w-4 h-4 text-primary shrink-0 mt-[2px]" />
            <p className="text-[9px] font-mono leading-normal text-text-muted">
              Vector nodes depict the spatial proximity of standard operating manuals. Laser links highlight dynamic cosine similarity matches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
