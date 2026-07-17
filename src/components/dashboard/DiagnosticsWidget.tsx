/**
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
