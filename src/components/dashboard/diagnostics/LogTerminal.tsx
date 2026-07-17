import * as React from "react";
import { 
  Cpu, Database, Clock, Terminal, Trash2, AlertTriangle, CheckCircle, Search, Sliders, Send
} from "lucide-react";
import { telemetry, ComponentHealth, StructuredLog } from "../../../services/observability";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "../../index";

export const LogTerminal: React.FC<{ logs: StructuredLog[], setLogs: (logs: StructuredLog[]) => void }> = ({ logs, setLogs }) => {
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
{/* 4. REAL-TIME STRUCTURED LOG EXPLORER / TERMINAL */}
      <Card shadow="medium" className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader className="border-b border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
            
            {/* Header Title */}
            <div className="flex items-center gap-xs">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <CardTitle className="text-body-lg font-bold text-slate-100">Observed Structured Logs Terminal</CardTitle>
                <CardDescription className="text-slate-400">Searchable live telemetry telemetry buffer.</CardDescription>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-sm flex-wrap">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-xs top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search logs/metadata..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-lg pr-xs py-xs text-xs rounded-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
                />
              </div>

              {/* Level Filter select */}
              <div className="flex items-center gap-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Level:</span>
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-xs text-xs text-slate-200 p-1 cursor-pointer"
                  value={logLevelFilter}
                  onChange={(e) => setLogLevelFilter(e.target.value as "ALL" | "INFO" | "WARN" | "ERROR")}
                >
                  <option value="ALL">ALL LEVELS</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>

              {/* Autoscroll checkbox */}
              <label className="flex items-center gap-xs text-[10px] text-slate-300 uppercase font-mono font-bold cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={autoScroll} 
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded-xs border-slate-800 bg-slate-950 text-emerald-500 cursor-pointer"
                />
                <span>Follow</span>
              </label>

              {/* Clear logs button */}
              <button 
                onClick={handleClearLogs}
                className="p-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Flush Log Buffer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        
        {/* Terminal logs viewport */}
        <CardContent className="p-0">
          <div className="bg-slate-950 p-md font-mono text-xs overflow-y-auto h-80 flex flex-col space-y-sm text-left">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-10 italic">
                No telemetry telemetry matches filter constraints.
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeColor = "text-sky-400 bg-sky-950/40";
                if (log.level === "WARN") badgeColor = "text-amber-400 bg-amber-950/40";
                if (log.level === "ERROR") badgeColor = "text-rose-400 bg-rose-950/40";
                
                return (
                  <div key={log.timestamp + log.message} className="border-b border-slate-900 pb-xs space-y-[2px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1xs">
                      <div className="flex items-center gap-sm">
                        <span className="text-slate-500 text-[10px]">{log.timestamp.split("T")[1].replace("Z", "")}</span>
                        <span className={`px-sm py-[1px] text-[9px] font-bold rounded-xs ${badgeColor}`}>{log.level}</span>
                        <span className="text-slate-100 font-semibold leading-relaxed break-all">{log.message}</span>
                      </div>
                      {log.correlationId && (
                        <span className="text-emerald-500 text-[9px] font-bold shrink-0">CORR: {log.correlationId}</span>
                      )}
                    </div>
                    {/* Log metadata if any */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-slate-400 text-[10px] bg-slate-900/30 p-xs rounded-xs overflow-x-auto mt-1xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </CardContent>
      </Card>

    
    </>
  );
};
