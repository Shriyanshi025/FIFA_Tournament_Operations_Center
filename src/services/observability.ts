/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Enterprise Telemetry, Structured Logging, and Health Monitoring Subsystem
// Tracks system startups, lifecycles, event bus rates, latencies, error states, and health indicators.

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  traceId?: string;
  incidentId?: string;
  simulationId?: string;
  operatorId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export type HealthStatus = "OK" | "DEGRADED" | "FAILING";

export interface ComponentHealth {
  status: HealthStatus;
  lastCheck: string;
  latencyMs: number;
  errorCount: number;
  message?: string;
}

export interface PlatformHealth {
  overall: HealthStatus;
  components: {
    SimulationEngine: ComponentHealth;
    EventBus: ComponentHealth;
    AIRuntime: ComponentHealth;
    GeminiProvider: ComponentHealth;
    KnowledgeLayer: ComponentHealth;
    RecommendationEngine: ComponentHealth;
    CollaborationLayer: ComponentHealth;
    WorkflowEngine: ComponentHealth;
  };
}

class TelemetryManager {
  private static instance: TelemetryManager;

  // In-memory ring buffer for diagnostics logs and history
  private logsBuffer: StructuredLog[] = [];
  private maxLogs = 500;

  // Rolling latency measurement caches
  private latencies: Record<string, number[]> = {
    ai_request: [],
    knowledge_retrieval: [],
    recommendation_generation: [],
    human_approval: [],
    dashboard_render: [],
    collaboration_sync: [],
  };

  // Performance metrics counters
  private metrics = {
    startupTimeMs: 0,
    eventBusThroughput: 0,
    recommendationsGenerated: 0,
    humanApprovalsProcessed: 0,
    simulationTicksCount: 0,
    collaborationSyncPackets: 0,
    errorCount: 0,
    currentFPS: 60,
    estimatedMemoryMb: 45.2,
  };

  // Component Health Registry
  private componentHealths: Record<string, ComponentHealth> = {
    SimulationEngine: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 2, errorCount: 0 },
    EventBus: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 1, errorCount: 0 },
    AIRuntime: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 45, errorCount: 0 },
    GeminiProvider: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 120, errorCount: 0 },
    KnowledgeLayer: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 15, errorCount: 0 },
    RecommendationEngine: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 22, errorCount: 0 },
    CollaborationLayer: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 8, errorCount: 0 },
    WorkflowEngine: { status: "OK", lastCheck: new Date().toISOString(), latencyMs: 5, errorCount: 0 },
  };

  private constructor() {
    this.metrics.startupTimeMs = Date.now();
    this.log("INFO", "TOC Nexus Telemetry Manager initialized successfully.", {
      env: "production",
      version: "1.0.0-rc1",
    });

    // Start estimated memory fluctuation & FPS background loops
    if (typeof window !== "undefined") {
      setInterval(() => {
        // Mock minor CPU/RAM volatility for operations screen realism
        const memVariation = (Math.random() - 0.5) * 1.5;
        this.metrics.estimatedMemoryMb = Math.max(30, parseFloat((this.metrics.estimatedMemoryMb + memVariation).toFixed(1)));
        
        const fpsVariation = Math.floor((Math.random() - 0.5) * 3);
        this.metrics.currentFPS = Math.min(60, Math.max(54, this.metrics.currentFPS + fpsVariation));
      }, 3000);
    }
  }

  public static getInstance(): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  // --- STRUCTURED LOGGING API ---
  public log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    ids?: {
      correlationId?: string;
      traceId?: string;
      incidentId?: string;
      simulationId?: string;
      operatorId?: string;
      durationMs?: number;
    }
  ) {
    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      ...ids,
    };

    // Console output mapping for observability sinks
    const _color = level === "ERROR" || level === "CRITICAL" ? "\x1b[31m" : level === "WARN" ? "\x1b[33m" : "\x1b[32m";
    console.log(`[TOC-OBSERVABILITY] [${logEntry.timestamp}] [${level}] ${message}`, metadata || "");

    this.logsBuffer.push(logEntry);
    if (this.logsBuffer.length > this.maxLogs) {
      this.logsBuffer.shift(); // Evict oldest log
    }

    if (level === "ERROR" || level === "CRITICAL") {
      this.metrics.errorCount++;
    }
  }

  // --- LATENCY & PERFORMANCE TRACKING ---
  public startTimer(key: keyof typeof this.latencies): () => number {
    const start = performance.now();
    return () => {
      const duration = parseFloat((performance.now() - start).toFixed(2));
      this.recordLatency(key, duration);
      return duration;
    };
  }

  public recordLatency(key: keyof typeof this.latencies, durationMs: number) {
    if (!this.latencies[key]) {
      this.latencies[key] = [];
    }
    this.latencies[key].push(durationMs);
    if (this.latencies[key].length > 50) {
      this.latencies[key].shift(); // Rolling window of 50 samples
    }
  }

  public incrementMetric(key: keyof Omit<typeof this.metrics, "estimatedMemoryMb" | "currentFPS" | "startupTimeMs">) {
    this.metrics[key]++;
  }

  // --- HEALTH MONITORING SERVICE ---
  public reportComponentStatus(
    componentName: keyof PlatformHealth["components"],
    status: HealthStatus,
    latencyMs: number,
    message?: string
  ) {
    const comp = this.componentHealths[componentName];
    if (comp) {
      comp.status = status;
      comp.lastCheck = new Date().toISOString();
      comp.latencyMs = latencyMs;
      if (status === "FAILING") {
        comp.errorCount++;
        this.log("CRITICAL", `Component health failure registered for ${componentName}. Error: ${message}`, {
          latencyMs,
        });
      } else if (status === "DEGRADED") {
        this.log("WARN", `Component ${componentName} performance degraded. Status message: ${message}`, {
          latencyMs,
        });
      }
    }
  }

  public getPlatformHealth(): PlatformHealth {
    const components = this.componentHealths as Record<string, ComponentHealth>;
    // Determine overall health based on components
    let overall: HealthStatus = "OK";
    const values = Object.values(components) as ComponentHealth[];
    if (values.some((c) => c.status === "FAILING")) {
      overall = "FAILING";
    } else if (values.some((c) => c.status === "DEGRADED")) {
      overall = "DEGRADED";
    }

    return {
      overall,
      components: {
        SimulationEngine: components.SimulationEngine,
        EventBus: components.EventBus,
        AIRuntime: components.AIRuntime,
        GeminiProvider: components.GeminiProvider,
        KnowledgeLayer: components.KnowledgeLayer,
        RecommendationEngine: components.RecommendationEngine,
        CollaborationLayer: components.CollaborationLayer,
        WorkflowEngine: components.WorkflowEngine,
      },
    };
  }

  // --- ACCESSORS FOR DIAGNOSTICS HUD ---
  public getLogs(): StructuredLog[] {
    return [...this.logsBuffer];
  }

  public clearLogs() {
    this.logsBuffer = [];
  }

  public getLatencyHistory(key: string): number[] {
    return this.latencies[key] ? [...this.latencies[key]] : [];
  }

  public getMetricsSummary() {
    const avgLatency = (key: string) => {
      const list = this.latencies[key] || [];
      if (list.length === 0) return 0;
      return parseFloat((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1));
    };

    return {
      ...this.metrics,
      uptimeSeconds: Math.floor((Date.now() - this.metrics.startupTimeMs) / 1000),
      averageLatenciesMs: {
        ai_request: avgLatency("ai_request"),
        knowledge_retrieval: avgLatency("knowledge_retrieval"),
        recommendation_generation: avgLatency("recommendation_generation"),
        human_approval: avgLatency("human_approval"),
        dashboard_render: avgLatency("dashboard_render"),
        collaboration_sync: avgLatency("collaboration_sync"),
      },
    };
  }
}

export const telemetry = TelemetryManager.getInstance();
