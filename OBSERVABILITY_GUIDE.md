# FIFA World Cup TOC - Observability & Telemetry Guide

## Subsystem Architecture
The TOC platform features an in-memory, highly performant observability subsystem located in `/src/services/observability.ts`. This layer provides real-time visibility into the health and performance of all tournament subsystems without changing runtime behavior.

```
       [ Simulation Engine ]  ───┐
                                 │
          [ Event Bus ]       ───┼──> [ Telemetry Manager ] ───> [ Engineering Diagnostics HUD ]
                                 │       (Ring Buffer)            - Real-time Charts
        [ Gemini Provider ]   ───┘                                - Searchable Log Terminal
```

---

## Core Telemetry Manager APIs

Developers and engineers can import the singleton `telemetry` instance from anywhere in the codebase:
```typescript
import { telemetry } from "@/src/services/observability";
```

### 1. Structured Logging API
Logs are retained in an in-memory ring buffer (up to 500 lines) and simultaneously output to the standard browser console:
```typescript
telemetry.log("INFO", "Telemetry logs purged manually.", { sector: "North Gate" }, { correlationId: "CORR-X920" });
```
* **Log Levels:** `DEBUG` | `INFO` | `WARN` | `ERROR` | `CRITICAL`
* **Optional Identifiers:** `correlationId`, `traceId`, `incidentId`, `simulationId`, `operatorId`, `durationMs`.

### 2. High-Resolution Latency Tracking
Latency values are captured using the performance timeline APIs. Start a timer and call the returned function to record the duration:
```typescript
const stopTimer = telemetry.startTimer("ai_request");
// Perform async AI request...
const elapsedMs = stopTimer(); // Automatically records duration under 'ai_request' key
```
* **Supported Keys:** `ai_request`, `knowledge_retrieval`, `recommendation_generation`, `human_approval`, `dashboard_render`, `collaboration_sync`.

### 3. Component Health Status Registry
Components report their health dynamically, triggering warning logs in the case of failures:
```typescript
telemetry.reportComponentStatus(
  "GeminiProvider", 
  "FAILING", 
  120, 
  "Simulated network timeout/credentials block."
);
```

---

## Metric Definitions & Benchmarks

| Metric Name | Description | Nominal Threshold | Critical Level |
| :--- | :--- | :--- | :--- |
| `ai_request` | Gemini inference response latency | `< 1200ms` | `> 4000ms` |
| `knowledge_retrieval` | Vector / SOP similarity query time | `< 100ms` | `> 500ms` |
| `recommendation_generation` | End-to-end evaluation pipeline delay | `< 1500ms` | `> 5000ms` |
| `human_approval` | Gold Commander response latency | N/A | N/A |
| `eventBusThroughput` | Total published event counts | N/A | N/A |
| `estimatedMemoryMb` | Estimated Javascript JS Heap footprint | `< 120MB` | `> 1024MB` |

---

## Diagnostics HUD & Lab Experiments
Operations teams can access the **Engineering Diagnostics & Telemetry Dashboard** directly from the primary navigation sidebar (System Administration group):

### 1. Live Performance Indicators
* Displays high-contrast health status cards for all 8 core services.
* Visualizes real-time average latency and peak timings via fluid progress bar components.
* Simulates physical hardware resource loads using Javascript heap approximation algorithms.

### 2. Failure Simulation Playground
The Diagnostics Dashboard includes an experimentation deck that tests system resilience in real time:
* **Gemini Provider Outage (429 / Throttling):** Forces the Gemini API connection into a `FAILING` state. Verifies that the UI falls back to offline, deterministic rules without throwing unhandled React exceptions.
* **RAG Index Degradation (SOP Lock):** Forces the Knowledge retrieval module to report a `DEGRADED` status, allowing SREs to test secondary lookup pathways.
* **Manual Telemetry Ingress:** Prompts engineers to inject specific mock latency times for performance testing.

### 3. Live Log Stream Terminal
* Implements a custom-styled, dark-themed terminal viewer displaying structured, timestamped logs.
* Features responsive search and filters to query logs by string matches or levels (`ALL`, `INFO`, `WARN`, `ERROR`).
* Supports **Autoscroll Follow** toggling and manual cache purges.
