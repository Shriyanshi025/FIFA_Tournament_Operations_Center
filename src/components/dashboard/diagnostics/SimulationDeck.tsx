import * as React from "react";
import { 
  Cpu, Database, Clock, Terminal, Trash2, AlertTriangle, CheckCircle, Search, Sliders, Send, Sparkles
} from "lucide-react";
import { telemetry, ComponentHealth } from "../../../services/observability";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "../../index";
import { useTournament } from "../../../context/TournamentContext";
import { AIRequestManager } from "../../../services/aiRuntime";

export const SimulationDeck: React.FC = () => {
  type LatencyKey = "ai_request" | "knowledge_retrieval" | "recommendation_generation" | "human_approval" | "dashboard_render" | "collaboration_sync";
  const [testLatencyKey, setTestLatencyKey] = React.useState<LatencyKey>("ai_request");
  const [testLatencyVal, setTestLatencyVal] = React.useState("120");
  const [simulatedAIFail, setSimulatedAIFail] = React.useState(false);
  const [simulatedRAGFail, setSimulatedRAGFail] = React.useState(false);
  const [customCrisisText, setCustomCrisisText] = React.useState("");
  const [generatingCrisis, setGeneratingCrisis] = React.useState(false);
  const { createIncident } = useTournament();

  const handleGenerateCrisis = async () => {
    if (!customCrisisText.trim()) return;
    setGeneratingCrisis(true);
    telemetry.log("INFO", `Initiating Generative "What-If" Scenario evaluation: "${customCrisisText}"`);
    
    try {
      const response = await AIRequestManager.getInstance().executeRequest<any>({
        promptId: "generate-custom-crisis",
        parameters: { crisisDescription: customCrisisText },
        priority: "HIGH"
      }, "google-gemini");

      const parsed = response.parsedData;
      if (parsed && parsed.title) {
        telemetry.log("INFO", `Generative Scenario parsed successfully. Creating incident: ${parsed.title}`);
        
        await createIncident({
          description: parsed.description || parsed.title,
          category: parsed.category || "FACILITIES",
          severity: parsed.severity || "HIGH",
          sector: parsed.sector || "North Sector",
          section: parsed.section || "Concourse Level",
          stadiumId: "ST-METLIFE"
        });

        telemetry.log("INFO", `Generative Crisis "${parsed.title}" injected. Recommendation and RAG systems synchronized.`);
        setCustomCrisisText("");
      } else {
        throw new Error("Failed to extract valid structured incident schema from AI generation.");
      }
    } catch (err: any) {
      console.error("Generative Crisis Error", err);
      telemetry.log("ERROR", `Generative Crisis injection failed: ${err.message || err}.`);
    } finally {
      setGeneratingCrisis(false);
    }
  };

  const handleSimulateLatency = () => {
    const parsedVal = parseInt(testLatencyVal, 10);
    if (!isNaN(parsedVal)) {
      telemetry.recordLatency(testLatencyKey as never, parsedVal);
      telemetry.log("INFO", `Injected simulated latency metric [${testLatencyKey}] of ${parsedVal}ms`);
    }
  };

  const handleToggleAIFailure = () => {
    const nextState = !simulatedAIFail;
    setSimulatedAIFail(nextState);
    if (nextState) {
      telemetry.reportComponentStatus("GeminiProvider", "FAILING", 0, "Simulated network timeout/credentials block.");
      telemetry.log("ERROR", "API Failure simulation active: Gemini API requests will fail.");
    } else {
      telemetry.reportComponentStatus("GeminiProvider", "OK", 0, "API restored.");
      telemetry.log("INFO", "Gemini API gateway connection restored successfully.");
    }
  };

  const handleToggleRAGFailure = () => {
    const nextState = !simulatedRAGFail;
    setSimulatedRAGFail(nextState);
    if (nextState) {
      telemetry.reportComponentStatus("KnowledgeLayer", "DEGRADED", 0, "Simulated vector index degradation.");
      telemetry.log("WARN", "RAG Failure simulation active: Vector store offline, fallback mode engaged.");
    } else {
      telemetry.reportComponentStatus("KnowledgeLayer", "OK", 0, "Index fully rebuilt.");
      telemetry.log("INFO", "Knowledge retrieval vector index fully reconciled.");
    }
  };

  return (
    <>
{/* 3. SIMULATION EXPERIMENTATION & FAILURE RECOVERY DECK */}
      <Card shadow="medium">
        <CardHeader>
          <div className="flex items-center gap-xs">
            <Sliders className="w-5 h-5 text-secondary" />
            <div>
              <CardTitle className="text-body-lg font-bold">Failure Injection & Diagnostics Lab</CardTitle>
              <CardDescription>Test enterprise SLA recovery and error states by injecting realistic system failures.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            
             {/* Failure Injection 1 */}
             <div className="p-md border rounded-sm space-y-sm text-left">
               <div className="flex flex-wrap justify-between items-center gap-xs">
                 <h5 className="font-display font-bold text-caption text-text-primary">Gemini Provider Outage</h5>
                 <Badge variant={simulatedAIFail ? "critical" : "success"} className="shrink-0 whitespace-nowrap">
                   {simulatedAIFail ? "FAILING" : "NOMINAL"}
                 </Badge>
               </div>
               <p className="text-caption text-text-secondary leading-relaxed">
                 Simulates standard API throttling (Rate Limit Exceeded) or API credential timeout error responses.
               </p>
               <Button 
                 variant={simulatedAIFail ? "success" : "outline"}
                 size="sm"
                 className="w-full font-bold"
                 onClick={handleToggleAIFailure}
               >
                 {simulatedAIFail ? "Restore Gateway Connection" : "Inject Gemini 429 Outage"}
               </Button>
             </div>
 
             {/* Failure Injection 2 */}
             <div className="p-md border rounded-sm space-y-sm text-left">
               <div className="flex flex-wrap justify-between items-center gap-xs">
                 <h5 className="font-display font-bold text-caption text-text-primary">RAG Index Degradation</h5>
                 <Badge variant={simulatedRAGFail ? "warning" : "success"} className="shrink-0 whitespace-nowrap">
                   {simulatedRAGFail ? "DEGRADED" : "NOMINAL"}
                 </Badge>
               </div>
              <p className="text-caption text-text-secondary leading-relaxed">
                Simulates temporary database locks, missing SOP collections, or degraded confidence score returns.
              </p>
              <Button 
                variant={simulatedRAGFail ? "success" : "outline"}
                size="sm"
                className="w-full font-bold"
                onClick={handleToggleRAGFailure}
              >
                {simulatedRAGFail ? "Restore RAG Index" : "Inject RAG DB Lockout"}
              </Button>
            </div>

            {/* Simulated Latency Injection */}
            <div className="p-md border rounded-sm space-y-sm text-left">
              <h5 className="font-display font-bold text-caption text-text-primary">Manual Telemetry Ingress</h5>
              <p className="text-caption text-text-secondary leading-relaxed">
                Record custom millisecond duration packets for profiling the live observability layer.
              </p>
              <div className="flex gap-xs items-center">
                <select 
                  className="rounded-xs border border-border bg-background text-text-primary text-xs p-xs flex-1 cursor-pointer"
                  value={testLatencyKey}
                  onChange={(e) => setTestLatencyKey(e.target.value as LatencyKey)}
                >
                  <option value="ai_request">AI Request Latency</option>
                  <option value="knowledge_retrieval">RAG Retrieval</option>
                  <option value="recommendation_generation">Recommendation Pipeline</option>
                  <option value="human_approval">Human Approval</option>
                  <option value="dashboard_render">Dashboard Render</option>
                  <option value="collaboration_sync">Collaboration Sync</option>
                </select>
                <input 
                  type="number" 
                  value={testLatencyVal} 
                  onChange={(e) => setTestLatencyVal(e.target.value)}
                  className="border border-border rounded-xs bg-background text-text-primary text-xs p-xs w-16"
                  placeholder="ms"
                />
                <Button variant="primary" size="sm" onClick={handleSimulateLatency} className="h-8">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>

          </div>

          {/* Dynamic Divider */}
          <div className="border-t border-border/40 my-md" />

          {/* Generative "What-If" Playground */}
          <div className="p-md border border-dashed rounded-sm bg-background/20 space-y-xs text-left" id="generative-whatif-simulator">
            <h5 className="font-display font-bold text-caption text-primary flex items-center gap-xs">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Generative "What-If" Crisis Simulator [Jury Special]
            </h5>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Describe any hypothetical World Cup operational emergency (e.g., <em>"Volunteers report turnstile failures at Gate North causing crowd congestion"</em> or <em>"Extreme heat causes fan dehydration in East stand requiring medical dispatch"</em>). The AI will generate custom telemetry inputs and inject the incident.
            </p>
            <div className="flex gap-sm items-center pt-2xs">
              <input 
                type="text" 
                value={customCrisisText} 
                onChange={(e) => setCustomCrisisText(e.target.value)}
                placeholder="e.g., 'Volunteers report gate ticket scanner failure at Gate North' or 'Escalator outage blocks accessibility routing at Sector West'..."
                className="flex-1 border border-border rounded-xs bg-background text-text-primary text-xs p-xs"
                disabled={generatingCrisis}
              />
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleGenerateCrisis} 
                className="h-8 font-bold flex items-center gap-1xs shrink-0"
                disabled={generatingCrisis}
              >
                {generatingCrisis ? "Simulating..." : "Trigger Crisis"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      
    </>
  );
};
