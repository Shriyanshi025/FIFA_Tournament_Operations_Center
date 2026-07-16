# FIFA Stadium Nexus — Backend Architecture & Core Contracts Specification
**Document Version:** 1.0.0  
**Phase:** Backend Contract & Data Modeling (Phase 6)  
**Target Event:** FIFA World Cup 2026™  
**Authors:** Principal Backend Architect, Domain Driven Design (DDD) Expert, Database Architect, API Architect, Event-Driven Systems Engineer

---

## 1. Domain Model (Domain Driven Design)

FIFA Stadium Nexus is modeled using **Domain-Driven Design (DDD)** principles. The backend is split into decoupled, autonomous bounded contexts, ensuring operational resilience and preventing tight coupling under heavy tournament loads.

```
       +-----------------------------------------------------------+
       |                  BOUNDED CONTEXTS MAP                     |
       +-----------------------------------------------------------+
       
          [ TELEMETRY DOMAIN ] ──(Raw Events)──> [ CROWD DOMAIN ]
                                                       │
                                                 (Wait alerts)
                                                       ▼
          [ DISPATCH DOMAIN ] <──(Task Cards)─── [ INCIDENT DOMAIN ]
                   ▲                                   │
                   │                             (Context query)
            (Assign field)                             ▼
                   │                             [ AI DOMAIN ]
                   │                                   │
                   └──────────(Action Plans)───────────┘
```

### 1.1 Incident Domain
* **Purpose:** Manages the lifecycle, tracking, and auditing of physical and operational events (medical, security, facilities, ticketing) occurring within the stadium.
* **Responsibilities:** Create, categorize, route, and log status transitions for stadium-wide incidents. Maintain chronological audit logs.
* **Boundaries:** Governs all state changes on `Incident` aggregates. Exposes safe REST queries for incident dashboards.
* **Dependencies:** Relies on the *Authentication Domain* for operator identity and the *AI Domain* for operational analysis.
* **Events Produced:** `IncidentCreated`, `IncidentUpdated`, `IncidentResolved`.
* **Events Consumed:** `CrowdThresholdExceeded`, `EmergencyDeclared`, `ResourceUnavailable`.

### 1.2 Telemetry Domain
* **Purpose:** High-throughput ingestion boundary responsible for processing continuous streams from physical IoT sensors, digital turnstiles, and camera video analytics.
* **Responsibilities:** Intake, sanitize, and validate incoming sensor telemetry packets. Perform statistical filtering.
* **Boundaries:** Isolated from database persistence. Operates as an in-memory streaming boundary.
* **Dependencies:** Minimal dependencies. Operates as an ingestion gate.
* **Events Produced:** `TelemetryDataIngested`.
* **Events Consumed:** None.

### 1.3 Crowd Domain
* **Purpose:** Tracks fan densities, queue sizes, and gate throughput across all sectors and access points.
* **Responsibilities:** Analyze telemetry aggregates, calculate rolling wait times, and predict line bottlenecks.
* **Boundaries:** Processes telemetry data in real-time. Translates metrics into crowd safety assessments.
* **Dependencies:** Consumes raw events from the *Telemetry Domain*.
* **Events Produced:** `CrowdThresholdExceeded`.
* **Events Consumed:** `TelemetryDataIngested`.

### 1.4 Dispatch Domain
* **Purpose:** Coordinates the physical movement and assignment of on-duty field teams (medical, security, volunteers).
* **Responsibilities:** Track active crew locations, check availability, push tasks to mobile clients, and capture feedback.
* **Boundaries:** Manages state transitions of staff resources. Coordinates field dispatches.
* **Dependencies:** Relies on the *Incident Domain* for situational triggers.
* **Events Produced:** `VolunteerAssigned`, `SecurityDispatched`, `FieldResponseUpdated`.
* **Events Consumed:** `DispatchApproved`, `IncidentResolved`.

### 1.5 AI Domain
* **Purpose:** Coordinates the reasoning, context retrieval (RAG), prompt orchestration, and output validation of the operations copilot.
* **Responsibilities:** Build targeted prompt contexts, query the Gemini API, validate outputs against target JSON schemas, and track response confidence.
* **Boundaries:** Interacts with the `@google/genai` library. Translates incident details into formatted action recommendations.
* **Dependencies:** Consumes contexts from the *Incident*, *Crowd*, and *Dispatch* domains.
* **Events Produced:** `RecommendationGenerated`.
* **Events Consumed:** `IncidentCreated`.

### 1.6 Authentication Domain
* **Purpose:** Manages operator credentials, sessions, and role-based permissions.
* **Responsibilities:** Authenticate operators, issue security tokens, and enforce resource access rules.
* **Boundaries:** Isolates user profiles and security roles.
* **Dependencies:** None.
* **Events Produced:** `OperatorSessionStarted`, `OperatorSessionTerminated`.
* **Events Consumed:** None.

### 1.7 Notification Domain
* **Purpose:** Delivers alerts, updates, and emergency directives to clients.
* **Responsibilities:** Manage active connection states and route messages based on role profiles.
* **Boundaries:** Handles real-time messaging delivery (WebSockets, push alerts).
* **Dependencies:** Relies on the *Authentication Domain* to verify recipient connections.
* **Events Produced:** `NotificationDelivered`.
* **Events Consumed:** `IncidentCreated`, `CrowdThresholdExceeded`, `EmergencyDeclared`, `WeatherAlertReceived`.

### 1.8 Analytics Domain
* **Purpose:** Aggregates and stores long-term historical records for operational reporting.
* **Responsibilities:** Roll up metrics into high-level reports and compute post-match KPIs.
* **Boundaries:** Read-heavy historical reporting datastore.
* **Dependencies:** Subscribes to events across all domains.
* **Events Produced:** `AnalyticsSnapshotCompiled`.
* **Events Consumed:** All major domain events.

### 1.9 Simulation Domain
* **Purpose:** Runs simulated events (bottlenecks, medical alarms) to train operators and validate platform behaviors.
* **Responsibilities:** Inject synthetic telemetry streams and log system outcomes.
* **Boundaries:** Strictly separated sandbox environment.
* **Dependencies:** Triggers inputs inside the *Telemetry* and *Incident* domains.
* **Events Produced:** `SimulationScenarioStarted`, `SimulationScenarioEnded`.
* **Events Consumed:** None.

---

## 2. Database Design & Enterprise Schema

The primary datastore uses **Firebase Firestore (Enterprise Edition)**, structured to support high-speed real-time reads and clean separation of concerns.

### 2.1 Collection Schemas & Relationships

#### Collection: `stadiums`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Stadium",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
    "name": { "type": "string", "maxLength": 100 },
    "capacity": { "type": "integer", "minimum": 10000 },
    "matchStatus": { "type": "string", "enum": ["PRE_MATCH", "LIVE", "POST_MATCH", "DORMANT"] },
    "config": {
      "type": "object",
      "properties": {
        "gates": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "targetCapacity": { "type": "integer" }
            }
          }
        },
        "sectors": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "name", "capacity", "matchStatus"]
}
```

#### Collection: `incidents`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Incident",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
    "stadiumId": { "type": "string" },
    "severity": { "type": "string", "enum": ["CRITICAL", "WARNING", "INFORMATIONAL"] },
    "status": { "type": "string", "enum": ["OPEN", "RESPONDING", "RESOLVED", "CLOSED"] },
    "category": { "type": "string", "enum": ["CROWD", "MEDICAL", "SECURITY", "FACILITIES"] },
    "description": { "type": "string", "maxLength": 1000 },
    "location": {
      "type": "object",
      "properties": {
        "sector": { "type": "string" },
        "section": { "type": "string" },
        "row": { "type": "string" },
        "seat": { "type": "string" },
        "coordinates": {
          "type": "object",
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" }
          }
        }
      },
      "required": ["sector", "section"]
    },
    "assignedStaff": { "type": "array", "items": { "type": "string" } },
    "reporterId": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "isDeleted": { "type": "boolean" }
  },
  "required": ["id", "stadiumId", "severity", "status", "category", "description", "location", "createdAt", "updatedAt"]
}
```

#### Collection: `staff_resources`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StaffResource",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string", "maxLength": 100 },
    "role": { "type": "string", "enum": ["TOC_OPERATOR", "SECURITY", "VOLUNTEER", "VENUE_STAFF"] },
    "status": { "type": "string", "enum": ["ON_DUTY", "DISPATCHED", "OFF_DUTY"] },
    "skills": { "type": "array", "items": { "type": "string" } },
    "currentSector": { "type": "string" },
    "deviceId": { "type": "string" },
    "lastActiveAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "name", "role", "status", "lastActiveAt"]
}
```

#### Collection: `ai_recommendations`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AiRecommendation",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "incidentId": { "type": "string" },
    "confidenceScore": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "decisionState": { "type": "string", "enum": ["PENDING", "APPROVED", "REJECTED", "MODIFIED"] },
    "proposal": {
      "type": "object",
      "properties": {
        "analysisSummary": { "type": "string" },
        "actionSteps": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "targetGroupId": { "type": "string" },
              "actionDescription": { "type": "string" },
              "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] }
            }
          }
        },
        "alternativeStrategy": { "type": "string" },
        "predictedOutcomes": { "type": "string" }
      },
      "required": ["analysisSummary", "actionSteps", "predictedOutcomes"]
    },
    "operatorId": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "evaluatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "incidentId", "confidenceScore", "decisionState", "proposal", "createdAt"]
}
```

### 2.2 Composite Indexes Strategy
To ensure sub-50ms query response times under maximum load, the following Firestore composite indexes are defined:
* Index 1: `incidents` | `stadiumId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)
* Index 2: `incidents` | `stadiumId` (Ascending) + `severity` (Ascending) + `isDeleted` (Ascending)
* Index 3: `staff_resources` | `role` (Ascending) + `status` (Ascending) + `currentSector` (Ascending)

### 2.3 Operations Policies
* **Soft Delete Strategy:** Documents are never physically deleted during a match window. Setting `isDeleted: true` hides records from client views while preserving them for legal reporting.
* **Audit Trail Strategy:** Write mutations to the `incidents` collection trigger an automated Cloud Function that logs the change payload, operator ID, and timestamp to a read-only `audit_logs` collection.
* **Archival Policy:** Operational logs are kept active in Firestore for 30 days post-tournament. They are then compressed and archived to cold cloud storage, with a retention limit of 7 years to meet FIFA safety compliance.

---

## 3. Event-Driven Architecture (EDA)

The Stadium Nexus backend utilizes an **event-driven architecture** to propagate state changes across services asynchronously.

```
+-------------------+      (Publish)      +-------------------+      (Push)      +------------------+
|   Incident Domain |  ─────────────────> |   Event Broker    |  ───────────────> | Notification Dom |
|   State Mutation  |                     |   (Google Pub/Sub)|                  | (Client Broadcast|
+-------------------+                     +-------------------+                  +------------------+
```

### 3.1 Domain Events Directory

#### A. `IncidentCreated`
* *Producer:* Incident Domain
* *Consumers:* AI Domain, Notification Domain, Analytics Domain
* *Payload:* `{ incidentId: "INC-399", severity: "CRITICAL", location: { sector: "South" }, timestamp: "2026-07-10T22:22:00Z" }`
* *Priority:* High (Zero-delay execution required).
* *Retry Strategy:* Exponential backoff (initial delay: 100ms, max retries: 5).

#### B. `CrowdThresholdExceeded`
* *Producer:* Crowd Domain
* *Consumers:* Incident Domain, Notification Domain
* *Payload:* `{ zoneId: "Gate-G", parameter: "wait_time", value: 22, limit: 15, timestamp: "2026-07-10T22:22:05Z" }`
* *Priority:* Medium.
* *Retry Strategy:* Immediate retry up to 3 times before routing to the Dead Letter Queue (DLQ).

#### C. `RecommendationGenerated`
* *Producer:* AI Domain
* *Consumers:* Notification Domain, Incident Domain
* *Payload:* `{ recommendationId: "REC-102", incidentId: "INC-399", confidence: 0.94, timestamp: "2026-07-10T22:22:08Z" }`
* *Priority:* High.
* *Retry Strategy:* Exponential backoff with jitter (max retries: 3).

#### D. `DispatchApproved`
* *Producer:* Incident Domain (triggered by Operator HUD)
* *Consumers:* Dispatch Domain, Notification Domain
* *Payload:* `{ incidentId: "INC-399", approvedBy: "OP-42", dispatchedTeams: ["SEC-03", "MED-02"], timestamp: "2026-07-10T22:22:12Z" }`
* *Priority:* High.
* *Retry Strategy:* At-least-once delivery guarantee. Critical dispatches block further actions until a client confirmation is received.

#### E. `EmergencyDeclared`
* *Producer:* Incident Domain
* *Consumers:* All Domains (Triggers system-wide lockdown protocols).
* *Payload:* `{ type: "EVACUATION", targetSectors: ["ALL"], operatorId: "OP-01", timestamp: "2026-07-10T22:22:15Z" }`
* *Priority:* Critical (Immediate, preemptive delivery).
* *Retry Strategy:* Multi-channel broadcast (WebSockets + Push Notifications + automated radio dispatch alerts). Continuous retries until acknowledged.

---

## 4. API Contract (REST API Specifications)

All REST API requests must contain a valid JWT Bearer Token in the `Authorization` header. Requests are structured using JSON payloads and return unified error formats if failures occur.

```
    REQUEST:  POST /api/v1/incidents
              Authorization: Bearer <JWT>
              Content-Type: application/json
              
    RESPONSE: 201 Created
              Content-Type: application/json
```

### 4.1 Global Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided incident coordinates are invalid.",
    "details": [
      { "field": "location.coordinates.latitude", "issue": "Must be a valid latitude float." }
    ],
    "timestamp": "2026-07-10T22:22:20Z"
  }
}
```

### 4.2 Endpoint Specifications

#### `POST /api/v1/auth/session`
* *Purpose:* Authenticates operators and field staff, issuing short-lived JWT session tokens.
* *Request Schema:*
  ```json
  {
    "username": "toc_operator_42",
    "pin": "429912",
    "activeStation": "TOC-Command-04"
  }
  ```
* *Response Schema:*
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 28800,
    "user": { "id": "OP-42", "name": "Jane Doe", "role": "TOC_OPERATOR" }
  }
  ```
* *Auth Rules:* Anonymous requests allowed. Checked by rate-limiters (max 5 requests/minute).

#### `GET /api/v1/incidents`
* *Purpose:* Retrieves active, unresolved incidents for the operator's current sector.
* *Parameters:*
  * `status` [String, Optional]: Filter by `OPEN` | `RESPONDING`.
  * `severity` [String, Optional]: Filter by `CRITICAL` | `WARNING`.
  * `limit` [Integer, Default: 50]: Maximum records to return.
* *Response Schema:*
  ```json
  {
    "incidents": [
      {
        "id": "INC-399",
        "stadiumId": "MIA-01",
        "severity": "CRITICAL",
        "status": "OPEN",
        "category": "MEDICAL",
        "description": "Seated fan complaining of chest pains.",
        "location": { "sector": "South", "section": "112" },
        "createdAt": "2026-07-10T22:22:00Z"
      }
    ]
  }
  ```
* *Auth Rules:* Authenticated operators only. Access is restricted to assigned sectors.

#### `GET /api/v1/incidents/:id/copilot`
* *Purpose:* Retrieves AI Copilot recommendations and reasoning vectors for a specific incident.
* *Response Schema:*
  ```json
  {
    "incidentId": "INC-399",
    "recommendation": {
      "id": "REC-102",
      "confidenceScore": 0.94,
      "analysisSummary": "Suspected cardiac event near South Concourse Sector.",
      "actionSteps": [
        { "targetGroupId": "MED-02", "actionDescription": "Dispatch paramedic squad with defibrillator unit.", "priority": "HIGH" }
      ],
      "alternativeStrategy": "Direct nearby gate volunteers to clear the exit path for emergency vehicles.",
      "predictedOutcomes": "Paramedic team arrives on scene within 3 minutes; crowd paths remain clear."
    }
  }
  ```
* *Auth Rules:* TOC Operators only. Returns an error if the incident is already resolved.

#### `POST /api/v1/incidents/:id/dispatch`
* *Purpose:* Approves an AI recommendation, initiating field notifications and dispatching teams.
* *Request Schema:*
  ```json
  {
    "approvedRecommendationId": "REC-102",
    "overrideActions": []
  }
  ```
* *Response Schema:*
  ```json
  {
    "success": true,
    "dispatchedAt": "2026-07-10T22:22:12Z",
    "notifiedTeamsCount": 2
  }
  ```
* *Auth Rules:* TOC Operators and Security Admins only.

---

## 5. WebSocket Contract (Real-Time Synchronisation)

WebSockets manage active connection states and broadcast real-time metrics, alerts, and task dispatches across TOC terminals and field devices.

### 5.1 Connection Lifecycle
* **Handshake:** Connection established over TLS (`wss://`). The client must pass their JWT session token inside the handshake query string (`?token=JWT`). Invalid or expired tokens result in immediate connection teardown.
* **Heartbeat:** To prevent silent connection drops, the server issues a `ping` frame every 25 seconds. The client must reply with a `pong` frame within 5 seconds; failing to reply triggers connection cleanup on the server.
* **Reconnection Strategy:** If a connection drops, client devices must use exponential backoff with random jitter to reconnect, protecting the server from connection storms.

### 5.2 Server Broadcast Rules & Event Catalog
* **`subscribe` (Client to Server):**
  * Payload: `{ "room": "sector_south_incidents" }`
* **`telemetry:stream` (Server to Client):**
  * Payload: `{ "zoneId": "Gate-G", "scansPerMinute": 412, "waitTime": 22 }`
  * Frequency: Sent every 3 seconds, throttled to prevent client UI performance lag.
* **`incident:alert` (Server to Client):**
  * Broadcasts new high-priority alerts to all active terminals in the target sector.
  * Payload: `{ "id": "INC-399", "severity": "CRITICAL", "headline": "Section 112 Medical Alarm" }`

---

## 6. Background Job Architecture

Long-running tasks and asynchronous operations are processed out-of-band by dedicated backend workers, protecting API latency and database performance.

```
    [ API Server ] ──(Insert Task)──> [ Queue Store (Redis) ] ──> [ Worker Pool ]
                                                                        │
                                                                        ▼
                                                                (Execute Task)
```

### 6.1 Job Directory

#### A. Prompt Analysis Engine
* *Triggers:* Fired whenever a new incident is created.
* *Processing Logic:* Builds the prompt context block, queries the Gemini API, parses the JSON response, validates it against the schema, and writes the output to the `ai_recommendations` collection.
* *Resource Budget:* Timeout limit: 4 seconds. Maximum memory usage: 256MB.

#### B. Mass SMS & Push Broadcasts
* *Triggers:* Critical weather alerts or emergency lockdowns.
* *Processing Logic:* Batches device IDs, structures payloads, and pushes alerts via Apple Push Notification Service (APNs) and Firebase Cloud Messaging (FCM).
* *Resource Budget:* Max throughput: 10,000 pushes/second. Decoupled using an active task queue.

#### C. Hourly Metric Aggregation
* *Triggers:* Cron scheduler trigger (Hourly).
* *Processing Logic:* Reads wait-time and throughput logs, calculates average, minimum, and peak metrics, and updates the historical reporting tables.

---

## 7. Scheduler & System Maintenance Design

A centralized scheduler coordinates automated maintenance, health checks, and data preparation tasks across the environment.

```
+-------------+      (Trigger)      +-----------------------------------------+
|  Scheduler  |  ─────────────────> | - Health Checks (every 30 seconds)      |
|  (Cron)     |                     | - Cache Warm-up (hourly)                |
|             |                     | - System Backup (daily at 03:00)        |
+-------------+                     +-----------------------------------------+
```

* **Health Monitoring (Every 30 Seconds):** Runs end-to-end connection checks on Firebase, the event broker, and the Gemini API, updating the TOC dashboard status indicators on changes.
* **Cache Refresh (Hourly):** Refreshes cached copies of static stadium configurations and Standard Operating Procedure documents in memory, keeping database reads minimal.
* **System Backup (Daily at 03:00):** Creates compressed, encrypted snapshots of all active operational tables, saving copies to isolated, secure cloud buckets.

---

## 8. Robust Error Taxonomy & Resolution Catalog

Every error returned by the backend is classified within a structured taxonomy, ensuring field staff and developers receive clear, actionable feedback under pressure.

| Error Code | Class | Root Cause | Client Recovery Path |
| :--- | :--- | :--- | :--- |
| `AUTH_EXPIRED` | Security | User's JWT session has expired. | Force client logout, clear local caches, and open the login screen. |
| `VALIDATION_FAILED` | Validation | Payload violates schema parameters (e.g., text length limits). | Highlight the invalid input fields and block form submission. |
| `AI_SCHEMA_MISMATCH` | AI Engine | Gemini's JSON response does not match the target schema structure. | Execute rules-based, deterministic fallback templates. |
| `FIRESTORE_DENIED` | Infrastructure | Operational action violates active database security rules. | Trigger secure local logging and alert the administrator. |
| `TELEMETRY_TIMED_OUT` | Infrastructure | Ingestion engine did not receive expected sensor feeds. | Mark the sensor status as offline and switch to manual wait-time tracking. |

---

## 9. Comprehensive System Observability

To maintain visibility and control under peak World Cup loads, Stadium Nexus uses a structured three-pillar observability framework.

### 9.1 Logging
* Logs are output as structured JSON objects to standard output streams, containing uniform fields including `timestamp`, `service`, `level`, `traceId`, and `message`.
* *Example Trace:*
  ```json
  {
    "timestamp": "2026-07-10T22:22:30.104Z",
    "level": "INFO",
    "service": "ai-orchestration-service",
    "traceId": "t-992a-112c",
    "message": "Gemini generation completed successfully.",
    "tokensUsed": 1024,
    "latencyMs": 1140
  }
  ```

### 9.2 Metrics & Telemetry
* System metrics (API response times, database write durations, CPU loads) are gathered and exposed to automated monitoring systems.
* Key Business Metrics: Tracks total active incidents, dispatch times, wait-time bottlenecks, and operator acceptance rates for AI recommendations.

---

## 10. Execution & Implementation Roadmap

The backend implementation is organized into four distinct milestones to ensure a clear, reliable development path.

```
       [ MILESTONE 1 ]         [ MILESTONE 2 ]         [ MILESTONE 3 ]         [ MILESTONE 4 ]
       Command Core            Streaming Telemetry     AI Reasoning Core       Real-time Dispatch
       - Auth contracts        - Queue ingestion       - Gemini SDK proxy      - Socket endpoints
       - Firestore schema      - Wait-time estimators  - Prompt templates      - Field client sync
```

### Milestone 1: Command Core & Operations Datastore (Effort: 3 Days)
* **Goal:** Set up basic authentication, define the initial Firestore schema, and implement the validation layer.
* **Deliverables:** JWT auth controllers, Firestore schemas, and global error handlers.
* **Validation Checklist:**
  * [ ] Verified that authentication endpoints reject invalid credentials.
  * [ ] Confirmed Firestore security rules block unauthorized writes.

### Milestone 2: Streaming Telemetry & Event Broker (Effort: 4 Days)
* **Goal:** Build the telemetry ingestion engine and integrate the real-time event broker.
* **Deliverables:** Stream processing endpoints, event message contracts, and queue brokers.
* **Validation Checklist:**
  * [ ] Verified the ingestion engine handles up to 500 requests/second under test loads.
  * [ ] Confirmed that threshold alerts successfully publish to the event broker.

### Milestone 3: AI Reasoning & Prompt Engineering Core (Effort: 5 Days)
* **Goal:** Build the Gemini-powered prompt orchestration layer and implement structured JSON output validation.
* **Deliverables:** Prompt context builders, Google Gen AI client proxies, schema validation middleware, and fallback scripts.
* **Validation Checklist:**
  * [ ] Verified AI outputs are validated against target JSON schemas correctly.
  * [ ] Confirmed that timeout and error conditions successfully trigger rules-based fallback templates.

### Milestone 4: Real-time Dispatch & Field Sync (Effort: 4 Days)
* **Goal:** Implement the WebSocket server and coordinate bi-directional task dispatches to field mobile devices.
* **Deliverables:** Socket.io event controllers, task routing handlers, and real-time metric broadcasts.
* **Validation Checklist:**
  * [ ] Verified that approved recommendations are dispatched to active field devices within 200ms.
  * [ ] Confirmed field status updates synchronize across all active command terminals.
