const fs = require('fs');

const diagPath = 'src/components/dashboard/DiagnosticsWidget.tsx';
let content = fs.readFileSync(diagPath, 'utf8');

// The split markers
const p1Start = content.indexOf('{/* 1. HEALTH INDICATORS GRID */}');
const p2Start = content.indexOf('{/* 2. LATENCY ANALYSIS & THROUGHPUT STATS */}');
const p3Start = content.indexOf('{/* 3. SIMULATION EXPERIMENTATION & FAILURE RECOVERY DECK */}');
const p4Start = content.indexOf('{/* 4. REAL-TIME STRUCTURED LOG EXPLORER / TERMINAL */}');
const rootEnd = content.lastIndexOf('</div>');

const healthContent = content.substring(p1Start, p2Start);
const latencyContent = content.substring(p2Start, p3Start);
const simContent = content.substring(p3Start, p4Start);
const termContent = content.substring(p4Start, rootEnd);

// Common Imports
const importsStr = `import * as React from "react";
import { 
  Cpu, Database, Clock, Terminal, Trash2, AlertTriangle, CheckCircle, Search, Sliders, Send
} from "lucide-react";
import { telemetry, ComponentHealth } from "../../../services/observability";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "../../index";
`;

const healthFile = importsStr + `
export const HealthIndicators: React.FC<{ health: Record<string, ComponentHealth> }> = ({ health }) => {
  return (
    <>
${healthContent}
    </>
  );
};
`;

const latencyFile = importsStr + `
export const LatencyAnalysis: React.FC<{ metrics: any, latencies: Record<string, { avg: number; count: number; max: number }> }> = ({ metrics, latencies }) => {
  // Memory Estimator helper
  const getEstimatedMemory = () => {
    if (typeof window !== "undefined" && (window.performance as any)?.memory) {
      const perfMemory = (window.performance as any).memory;
      return {
        used: Math.round(perfMemory.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(perfMemory.totalJSHeapSize / (1024 * 1024)),
        limit: Math.round(perfMemory.jsHeapLimit / (1024 * 1024))
      };
    }
    return {
      used: Math.round(25 + 0.05 + metrics.eventBusThroughput * 0.01),
      total: 128,
      limit: 512
    };
  };

  return (
    <>
${latencyContent}
    </>
  );
};
`;

const simFile = importsStr + `
export const SimulationDeck: React.FC = () => {
  const [testLatencyKey, setTestLatencyKey] = React.useState("ai_request");
  const [testLatencyVal, setTestLatencyVal] = React.useState("120");
  const [simulatedAIFail, setSimulatedAIFail] = React.useState(false);
  const [simulatedRAGFail, setSimulatedRAGFail] = React.useState(false);

  const handleSimulateLatency = () => {
    const parsedVal = parseInt(testLatencyVal, 10);
    if (!isNaN(parsedVal)) {
      telemetry.recordLatency(testLatencyKey as any, parsedVal);
      telemetry.log("INFO", \`Injected simulated latency metric [\${testLatencyKey}] of \${parsedVal}ms\`);
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
${simContent}
    </>
  );
};
`;

const termFile = importsStr + `
export const LogTerminal: React.FC<{ logs: any[], setLogs: (logs: any[]) => void }> = ({ logs, setLogs }) => {
  const [logSearch, setLogSearch] = React.useState("");
  const [logLevelFilter, setLogLevelFilter] = React.useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const terminalEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    telemetry.clearLogs();
    setLogs([]);
    telemetry.log("INFO", "Telemetry logs purged manually by engineering supervisor.");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = logSearch
      ? log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
        JSON.stringify(log.metadata || {}).toLowerCase().includes(logSearch.toLowerCase())
      : true;
    const matchesLevel = logLevelFilter === "ALL" ? true : log.level === logLevelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <>
${termContent}
    </>
  );
};
`;

const parentFile = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from "react";
import { telemetry } from "../../services/observability";
import { HealthIndicators } from "./diagnostics/HealthIndicators";
import { LatencyAnalysis } from "./diagnostics/LatencyAnalysis";
import { SimulationDeck } from "./diagnostics/SimulationDeck";
import { LogTerminal } from "./diagnostics/LogTerminal";

export const DiagnosticsWidget: React.FC = () => {
  const [logs, setLogs] = React.useState(telemetry.getLogs());
  const [metrics, setMetrics] = React.useState(telemetry.getMetricsSummary());
  const [health, setHealth] = React.useState(telemetry.getPlatformHealth().components);
  const [latencies, setLatencies] = React.useState<Record<string, { avg: number; count: number; max: number }>>({});
  
  React.useEffect(() => {
    const updateStats = () => {
      setLogs(telemetry.getLogs());
      setMetrics(telemetry.getMetricsSummary());
      setHealth(telemetry.getPlatformHealth().components);
      
      const latencyKeys = [
        "ai_request", "knowledge_retrieval", "recommendation_generation", 
        "human_approval", "dashboard_render", "collaboration_sync"
      ];
      
      const latencyAggregation: Record<string, { avg: number; count: number; max: number }> = {};
      latencyKeys.forEach(key => {
        const history = telemetry.getLatencyHistory(key);
        if (history.length > 0) {
          const sum = history.reduce((acc: number, v: number) => acc + v, 0);
          const max = Math.max(...history);
          latencyAggregation[key] = {
            avg: Math.round(sum / history.length),
            count: history.length,
            max: Math.round(max)
          };
        } else {
          latencyAggregation[key] = { avg: 0, count: 0, max: 0 };
        }
      });
      setLatencies(latencyAggregation);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-lg animate-fade-in" id="diagnostics-widget-layout">
      <HealthIndicators health={health} />
      <LatencyAnalysis metrics={metrics} latencies={latencies} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-md">
        <SimulationDeck />
        <LogTerminal logs={logs} setLogs={setLogs} />
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/dashboard/diagnostics/HealthIndicators.tsx', healthFile);
fs.writeFileSync('src/components/dashboard/diagnostics/LatencyAnalysis.tsx', latencyFile);
fs.writeFileSync('src/components/dashboard/diagnostics/SimulationDeck.tsx', simFile);
fs.writeFileSync('src/components/dashboard/diagnostics/LogTerminal.tsx', termFile);
fs.writeFileSync('src/components/dashboard/DiagnosticsWidget.tsx', parentFile);

