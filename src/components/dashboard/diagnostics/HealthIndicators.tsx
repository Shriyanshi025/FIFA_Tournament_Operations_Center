import * as React from "react";
import { 
  Cpu, Database, Clock, Terminal, Trash2, AlertTriangle, CheckCircle, Search, Sliders, Send
} from "lucide-react";
import { telemetry, ComponentHealth } from "../../../services/observability";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "../../index";

export const HealthIndicators: React.FC<{ health: Record<string, ComponentHealth> }> = ({ health }) => {
  return (
    <>
{/* 1. HEALTH INDICATORS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-sm" id="diagnostics-health-grid">
        {Object.entries(health).map(([compName, data]) => {
          const status = data as ComponentHealth;
          const isOK = status.status === "OK";
          const isDegraded = status.status === "DEGRADED";
          return (
            <Card key={compName} className="p-sm flex flex-col justify-between" shadow="low">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-text-muted font-bold truncate uppercase">{compName}</span>
                {isOK ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : isDegraded ? (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
                )}
              </div>
              <div className="mt-md space-y-1xs">
                <div className={`text-h3 font-display font-bold ${
                  isOK ? "text-success" : isDegraded ? "text-warning" : "text-error"
                }`}>
                  {status.status}
                </div>
                <div className="font-mono text-[8px] text-text-secondary truncate" title={status.message || "Connected"}>
                  {status.message || "No issues reported"}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      
    </>
  );
};
