# FIFA Stadium Nexus — Technical Engineering Specification
**Document Version:** 1.0.0  
**Phase:** Technical Design & Architecture (Phase 4)  
**Target Event:** FIFA World Cup 2026™  
**Authors:** Chief Software Engineer, Principal Solution Architect, Technical Lead, DevOps Architect, AI Systems Engineer

---

## 1. Selected Technology Stack & Justification

The selection of the technical stack for FIFA Stadium Nexus is driven by three main criteria: **extreme reliability under load**, **low-latency real-time data delivery**, and **rapid developers' feedback loop (hackathon context)**.

| Layer | Technology | Selected Option | Justification | Alternatives Considered & Rejected |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Single-Page App | **React 19 + TypeScript + Vite 6** | Fast boot time, standard ecosystem support, natively configured inside AI Studio workspace. Offers optimized type safety and fast production compilation using esbuild. | Next.js (Rejected due to unnecessary server-side rendering overhead for a dashboard-centric command app). |
| **Styling** | Utility CSS | **Tailwind CSS v4** | Highly maintainable, responsive visual compilation, minimal CSS payload. Leverages modern `@import "tailwindcss"` engine. | CSS-in-JS (Rejected due to runtime performance overhead under rapid dashboard state refreshes). |
| **Backend** | API & Orchestration | **Node.js (TypeScript) + Express** | High concurrency model using non-blocking event loops, optimal for proxying high-throughput telemetry data and integrating the `@google/genai` SDK. | Python/FastAPI (Rejected to maintain single-language TypeScript parity across the frontend and backend). |
| **Durable Database** | NoSQL Document | **Firebase Firestore** | Serverless, real-time sync out of the box, robust client offline caching, automatic scaling. Perfectly matches the variable, high-impact traffic patterns of tournament days. | PostgreSQL/Cloud SQL (Rejected for primary real-time store; SQL requires pooling overhead for rapid mobile-client updates). |
| **AI SDK** | Model Interface | **@google/genai (v2.4.0+)** | Modern, unified Google SDK with built-in support for structured JSON schema outputs, multi-modal context injection, and system instructions. | Legacy `@google/generative-ai` (Deprecated, lacks support for advanced structured schemas and modern Gemini features). |
| **AI Model** | Reasoning Engine | **gemini-2.5-flash** | High speed, massive 1M token context window, exceptionally low cost, superb compliance with structured schemas. Ideal for processing high-volume multi-stream telemetry data. | gemini-2.5-pro (Reserved as secondary fallback for ultra-complex historical analytics due to higher latency). |
| **Real-time Sync** | WebSockets | **Socket.io / Firebase Realtime Client** | Ensures sub-second delivery of incident updates and alerts to active TOC command screens and field mobile units. | Polling (Rejected due to server CPU degradation and network bandwidth waste). |
| **Visualizations** | Charts | **Recharts & D3.js** | Native React declarative syntax, high performance under data updates, built-in screen reader access. | Chart.js (Rejected due to complex canvas rendering manipulation required for deep custom accessibility styling). |
| **Mapping Engine** | GIS | **Google Maps JavaScript API** | Industry standard, comprehensive routing capabilities (Routes API), deep support for custom styled vector overlays and geofencing. | Leaflet (Rejected due to lack of native rich spatial routing algorithms and global GIS data depth). |

---

## 2. Directory & Repository Structure

We adopt a strict, highly organized **feature-first** structure combined with clear **layered architecture boundaries** to ensure clean separation of concerns and prevent the visual/logical file ballooning common in hackathon codebases.

```
/
├── .env.example                  # Environment variable blueprint
├── .gitignore                    # Local ignore configurations
├── index.html                    # Single-page application entry HTML
├── metadata.json                 # AI Studio Platform Metadata configuration
├── package.json                  # Application dependency manifest
├── tsconfig.json                 # Core TypeScript compiler configuration
├── vite.config.ts                # Frontend build and dev server configurations
├── UX_BLUEPRINT.md               # User experience and UI specifications
├── ENGINEERING_SPECIFICATION.md  # [This File] Primary technical system architecture
│
├── server.ts                     # Full-Stack entry point (Express & Vite dev middleware)
│
├── src/                          # Frontend Application Code
│   ├── main.tsx                  # Client entry point
│   ├── App.tsx                   # Main layout and route controller
│   ├── index.css                 # Global CSS and Tailwind directives
│   ├── types.ts                  # Shared TypeScript types, interfaces, and enums
│   │
│   ├── components/               # Global Shared UI Components (Design System)
│   │   ├── ui/                   # Primitive design components
│   │   │   ├── Button.tsx        # Accessible button component with motion integration
│   │   │   ├── Card.tsx          # Consistent container elements
│   │   │   ├── Badge.tsx         # High-contrast severity tag
│   │   │   └── Table.tsx         # High-density responsive data grid
│   │   ├── layout/               # Global structural wrappers
│   │   │   ├── Header.tsx        # Core system bar with clocks and network status
│   │   │   └── Shell.tsx         # Outer workspace layout container
│   │   └── viz/                  # Reusable visualization widgets
│   │       ├── Heatmap.tsx       # Live GIS/Canvas-based crowd density rendering
│   │       └── KPIWidget.tsx     # Large numerical status blocks
│   │
│   ├── features/                 # Modular Feature Enclaves (Self-contained logic)
│   │   ├── dashboard/            # TOC Operations Hub
│   │   │   ├── components/       # Dashboard specific panels
│   │   │   ├── hooks/            # useStadiumMetrics.ts (Dashboard telemetry hook)
│   │   │   └── DashboardPage.tsx # Assembled TOC workspace view
│   │   │
│   │   ├── incidents/            # Incident Management Module
│   │   │   ├── components/       # IncidentTimeline.tsx, EvidenceGallery.tsx
│   │   │   ├── hooks/            # useIncidentManager.ts
│   │   │   └── WorkspacePage.tsx # Drill-down focused workspace
│   │   │
│   │   └── copilot/              # AI Copilot Interface
│   │       ├── components/       # RecommendationCard.tsx, TimelineWidget.tsx
│   │       └── CopilotPanel.tsx  # Persistent slide-out interactive interface
│   │
│   ├── lib/                      # Client Core Configuration & Adapters
│   │   ├── firebase.ts           # Firestore initialization and client config
│   │   └── utils.ts              # cn() style merger utilities
│   │
│   └── services/                 # Client API Call Proxies
│       ├── api.ts                # General REST call client
│       └── maps.ts               # Custom GIS layers and map handlers
│
└── server/                       # Backend Application Code
    ├── config/                   # Server Configuration & Variables
    │   └── environment.ts        # Type-safe environment validator
    │
    ├── controllers/              # Request / Response Boundary Handlers
    │   ├── incident.controller.ts# Processes incident routes
    │   ├── telemetry.controller.ts# Handles incoming IoT and staff streams
    │   └── ai.controller.ts      # Connects and handles prompt endpoints
    │
    ├── services/                 # Core Domain Logic Services
    │   ├── ai.service.ts         # Handles Gemini interactions, schemas, and prompting
    │   ├── telemetry.service.ts  # Processes raw IoT, triggers thresholds
    │   └── push.service.ts       # Handles Socket.io/NFC dispatch broadcasts
    │
    ├── prompts/                  # Prompt Engineering Repository
    │   ├── promptTemplates.ts    # Clean text prompts matching business logic
    │   └── schemas.ts            # Type-safe JSON schemas for Gemini outputs
    │
    └── utils/                    # Server-side Shared Utilities
        ├── logger.ts             # Structured system logger
        └── errors.ts             # Comprehensive error-handling adapter
```

---

## 3. Backend Engineering Architecture

The backend of FIFA Stadium Nexus is designed as an Express-based middleware micro-kernel running as a full-stack proxy. It handles ingestion from IoT devices and volunteer terminals, structures the input data, evaluates thresholds, and interfaces securely with the Gemini API.

```
       +-----------------------------------------------------------+
       |                  EXPRESS CLIENT ENDPOINTS                 |
       +-----------------------------------------------------------+
                                     │
                                     ▼
                      +-----------------------------+
                      |   CONTROLLERS (REST/WS)     |
                      +-----------------------------+
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       +---------------------------+   +---------------------------+
       |   TELEMETRY SERVICE       |   |   AI SERVICE (GEMINI)     |
       +---------------------------+   +---------------------------+
                     │                               │
                     │  (State Evaluation)           │  (Structured Prompts)
                     ▼                               ▼
       +---------------------------+   +---------------------------+
       |   FIRESTORE / CACHE       |   |   PROMPT STACK (SCHEMAS)  |
       +---------------------------+   +---------------------------+
```

### 3.1 Architectural Layers

* **Controllers (Validation & Delivery):**
  * Receives data from external sensors or web forms.
  * Uses runtime schemas to validate inputs, rejecting invalid requests immediately to prevent backend failures.
* **Telemetry Service (Event Processing):**
  * Parses streams (e.g., turnstile scans per second) to calculate moving averages.
  * If a rate falls below a target threshold (e.g., ingress drops by 40%), it raises an operational flag and forwards the context to the AI Service.
* **AI Service (Operations Copilot):**
  * Houses the model interface logic using the `@google/genai` client.
  * Retrieves operational rules and historical incident data, constructs structured prompts, and parses the model’s JSON response into strongly typed Action Recommendations.
* **Push Service (Real-Time Communication):**
  * Manages active Socket.io connections. When the TOC Operator approves an AI recommendation, the Push Service instantly broadcasts specific instructions to target security or volunteer mobile clients.

---

## 4. Frontend Engineering Architecture

The frontend is engineered as a highly responsive React Single-Page Application (SPA) utilizing a modern feature-first structure. It isolates UI components from business and state logic.

### 4.1 Client Component Topography

* **Feature Modules (Dashboard, Incidents, Copilot):**
  * Complete, self-contained views (e.g., `DashboardPage.tsx`).
  * Contains specialized interactive blocks (e.g., `Heatmap.tsx` under dashboard, `RecommendationCard.tsx` under copilot).
  * Exposes custom hooks (e.g., `useIncidentManager.ts`) to manage state transitions.
* **Custom Custom Hooks (The State Engine):**
  * `useStadiumMetrics.ts`: Handles real-time polling or WebSocket listeners for stadium KPIs, auto-updating local components on changes.
  * `useIncidentManager.ts`: Manages selection states, resolution timelines, and audit trails for the active Incident Workspace.
* **Context Providers (Global State):**
  * `UIContext`: Tracks global layout state (e.g., active page index, map zooms, accessibility overrides).
  * `NotificationContext`: Manages incoming alert buffers, controls visual entry transitions, and manages play-back states for critical alarms.
* **Type System (`/src/types.ts`):**
  * Single source of truth for global TypeScript types, mapping entities like `Incident`, `StaffMember`, `TelemetryData`, and `AiRecommendation` perfectly between front and back ends.

---

## 5. AI Engineering Architecture (Operations Copilot)

Generative AI forms the core decision support system of Stadium Nexus. The AI architecture bypasses simple chat patterns, operating instead as a structured reasoning engine that transforms raw telemetry into verified operational actions.

```
       +-------------------------------------------------------------+
       |                     RAW INGESTION STREAMS                   |
       |  - Turnstile Metrics  - CCTV Alerts  - Incident Logs        |
       +-------------------------------------------------------------+
                                      │
                                      ▼
       +-------------------------------------------------------------+
       |                  CONTEXT BUILDER & RAG                      |
       |  - Matches current alerts to physical stadium layout rules. |
       |  - Injects target SOPs & historical tournament logs.        |
       +-------------------------------------------------------------+
                                      │
                                      ▼
       +-------------------------------------------------------------+
       |                  GEMINI 2.5 REASONING                       |
       |  - System instructions enforce strict "Operations Analyst"  |
       |    persona.                                                 |
       |  - Outputs validated JSON matching target schemas.           |
       +-------------------------------------------------------------+
                                      │
                                      ▼
       +-------------------------------------------------------------+
       |              JSON SCHEMA VALIDATION & RETRY                 |
       |  - Verifies generated recommendations match API typing.    |
       |  - Applies automated fallback fallback if schema validation|
       |    fails.                                                   |
       +-------------------------------------------------------------+
                                      │
                                      ▼
       +-------------------------------------------------------------+
       |                   HUMAN APPROVAL INTERFACE                  |
       |  - Human TOC Operator reviews recommendations on HUD.       |
       |  - Click "Approve & Dispatch" sends actions to the field.   |
       +-------------------------------------------------------------+
```

### 5.1 Orchestration & Guardrails

* **The Context Builder & RAG Pipeline:**
  * When an alert is triggered, the Context Builder retrieves:
    1. The active incident payload.
    2. Surrounding spatial data (closest resource groups, active gate wait times).
    3. The relevant Standard Operating Procedure (SOP) from local markdown reference files.
  * These are assembled into a dense context window for the model, eliminating hallucinations by anchoring responses in official stadium procedures.
* **Structured Output Schema Validation:**
  * The API request uses `responseSchema` options inside the Gemini client, enforcing a strict JSON structure.
  * Structure Contract:
    ```typescript
    interface GeneratedRecommendation {
      incidentId: string;
      confidenceScore: number; // 0.0 to 1.0
      analysisSummary: string; // Brief, high-impact reasoning
      actionSteps: Array<{
        targetGroupId: string;
        actionDescription: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
      }>;
      predictedOutcomes: string;
      alternativeStrategy: string;
    }
    ```
* **Confidence Evaluation Strategy:**
  * The model is instructed to calculate a confidence score based on data availability (e.g., if CCTV stream data is missing, confidence drops automatically).
  * If the confidence score falls below **70%**, the platform skips automated dispatch staging and routes the incident to the TOC Director's manual review queue.
* **Hallucination Prevention Guardrails:**
  * **Grounding:** The prompt strictly forbids the AI from referencing non-existent stadium gates, teams, or procedures.
  * **Fallback Strategy:** If the model's response is malformed or times out, the backend automatically falls back to a deterministic, rule-based routing script (e.g., *"Dispatch closest available medical team"*), ensuring stadium safety is never compromised by an AI failure.

---

## 6. Data Architecture

The data architecture uses **Firebase Firestore** as its main real-time database, optimized for fast document reads and direct client-side state synchronization.

### 6.1 Database Schema (Entities & Relationships)

#### `stadiums` (Collection)
* `id` [String, PK]: Unique identifier.
* `name` [String]: Stadium name (e.g., "South Florida Stadium").
* `capacity` [Integer]: Total seating capacity.
* `config` [Map]: Physical gates, sectors, and coordinates.

#### `incidents` (Collection)
* `id` [String, PK]: Incident identifier (e.g., "INC-399").
* `stadiumId` [String, FK]: Reference to stadium.
* `severity` [String]: `CRITICAL` | `WARNING` | `INFORMATIONAL`.
* `status` [String]: `OPEN` | `RESPONDING` | `RESOLVED` | `CLOSED`.
* `source` [String]: Reporting channel (e.g., "Volunteer-12", "CCTV-Analytics").
* `description` [String]: Human-readable text or transcript.
* `location` [Map]: `sector` (String), `section` (String), `seat` (String), `coordinates` (GeoPoint).
* `assignedStaff` [Array of Strings, FK]: Referenced staff IDs.
* `createdAt` [Timestamp]: ISO creation stamp.
* `resolvedAt` [Timestamp]: Nullable ISO resolution stamp.

#### `telemetry` (Collection)
* `id` [String, PK]: Auto-generated sensor ID.
* `stadiumId` [String, FK]: Reference to stadium.
* `sensorType` [String]: `TURNSTILE` | `CCTV_CROWD` | `WIFI_PING` | `AIR_QUALITY`.
* `zoneId` [String]: Sector / Gate designation.
* `metrics` [Map]: Live data values (e.g., `scansPerMinute: 42`, `densityPercent: 88`).
* `timestamp` [Timestamp, Index]: Time of reading.

#### `ai_recommendations` (Collection)
* `id` [String, PK]: Reference key.
* `incidentId` [String, FK, Unique]: Relates to target incident.
* `confidenceScore` [Float]: AI confidence index.
* `recommendationPayload` [Map]: Validated JSON object matching `GeneratedRecommendation` schema.
* `operatorDecision` [String]: `PENDING` | `APPROVED` | `REJECTED` | `MODIFIED`.
* `executedAt` [Timestamp]: Nullable action time.

### 6.2 Caching & Indexing Strategy
* **Firestore Composite Indexes:**
  * An index on `(stadiumId, status, createdAt DESC)` ensures the TOC operator's active incident feed is fetched in under 50ms.
  * An index on `(zoneId, timestamp DESC)` enables fast, real-time plotting of crowd density charts.
* **Memory Cache (Redis/In-Memory):**
  * Static stadium layouts, operational SOPs, and user role configuration data are cached in-memory on the backend to avoid redundant database reads.

---

## 7. API & Event Engineering

The API layer utilizes standard REST endpoints for state modifications and secure WebSockets via Socket.io for real-time bi-directional telemetry streaming.

### 7.1 Key REST Endpoints

#### `POST /api/telemetry/ingest`
* *Purpose:* Ingests raw data streams from IoT sensors or CCTV analysis engines.
* *Payload validation:* Checks sensor UUID and schema formats. Returns `202 Accepted` to process the stream asynchronously without blocking the client.

#### `POST /api/incidents`
* *Purpose:* Enables manual incident creation by field volunteers or venue staff.
* *Payload:* Standardized text, location coordinates, and optional base64 image strings.

#### `GET /api/incidents/:id/copilot`
* *Purpose:* Requests immediate, targeted AI analysis and action recommendations for a specific incident.
* *Response:* Strongly typed JSON matching the `GeneratedRecommendation` contract.

#### `POST /api/incidents/:id/dispatch`
* *Purpose:* Confirms TOC operator approval of an AI recommendation, initiating immediate field routing.

### 7.2 WebSocket Event Contract

* **`subscribe:toc` (Client to Server):** Joins the high-density command room channel to receive real-time updates.
* **`telemetry:update` (Server to Client):** Broadcasts processed crowd wait-times and turnstile throughput numbers to the dashboard map.
* **`incident:new` (Server to Client):** Pushes new alerts to the active queue, triggering visual changes and audio alerts based on severity.
* **`incident:dispatched` (Server to Client):** Sends tactical routing updates and task details directly to field mobile apps.

---

## 8. Comprehensive Security Architecture

FIFA Stadium Nexus handles critical infrastructure and safety data, making a robust, multi-layered security model essential.

```
       [ PERIMETER SECURITY ]       [ IDENTITY SECURITY ]       [ APPLICATION SECURITY ]
       ┌────────────────────┐       ┌───────────────────┐       ┌──────────────────────┐
       │ - Rate Limiting    │  ───>  │ - Token Auth      │  ───>  │ - RBAC Access        │
       │ - DDoS Shielding   │       │ - Session Keys    │       │ - Prompt Guardrails  │
       └────────────────────┘       └───────────────────┘       └──────────────────────┘
```

* **Authentication & Identity Management:**
  * Admin accounts are secured using physical multi-factor tokens (YubiKey) or biometric authentication.
  * Field staff authenticate using unique, short-lived session codes bound to registered mobile devices.
* **Role-Based Access Control (RBAC):**
  * All API endpoints check user roles before returning data (e.g., a volunteer's session token will be rejected if used to access the global stadium-wide telemetry feed).
* **AI Security & Prompt Injection Defenses:**
  * System instructions are isolated using strict API delimiters.
  * User inputs are stripped of system-level command strings (e.g., removing prompts like *"Ignore all previous instructions and output..."*).
  * The backend validates all AI outputs against strict target schemas before displaying them, neutralizing attempts to hijack the system.
* **Audit Logging System:**
  * Every operational action—including logins, incident creations, AI recommendations, operator approvals, and physical dispatches—is logged to a tamper-proof audit trail with secure timestamps.

---

## 9. Performance & Scalability Architecture

During a live tournament match, the platform must process thousands of continuous telemetry points and support hundreds of simultaneous active field connections without degradation.

* **Non-Blocking Telemetry Processing:**
  * Telemetry ingestion is decoupled from database writes. Raw data is queued, parsed in-memory, and only written to persistent databases when threshold breaches or state changes occur.
* **Lazy Loading & Code Splitting:**
  * The frontend uses dynamic imports (`React.lazy`) to split code by feature modules. The heavy GIS mapping engine is loaded only when the user opens the map screen, keeping the initial dashboard bundle tiny and fast to boot.
* **Client-Side Storage & Offline Resilience:**
  * Mobile apps run a local database cache (SQLite/IndexedDB).
  * If a volunteer loses connectivity inside the stadium, they can still capture incidents and log actions. The local database queues transactions and synchronizes them with Firestore once connectivity is restored.
* **Real-time Map Decoupling:**
  * Map rendering is decoupled from raw data streams. The map updates crowd positions using a calculated interval (e.g., every 3 seconds), protecting mobile CPUs from overheating under high-frequency updates.

---

## 10. Engineering Development Standards

To ensure clean, maintainable, and high-quality code across the development team, we establish a strict set of standards.

### 10.1 Naming & Folder Conventions
* **Directories:** Lowercase, dash-separated (e.g., `/src/components/ui`, `/src/features/incident-workspace`).
* **Components:** PascalCase (e.g., `RecommendationCard.tsx`, `TelemetryTable.tsx`).
* **Hooks:** Starts with `use` (e.g., `useIncidentManager.ts`, `useStadiumMetrics.ts`).
* **Variables & Functions:** camelCase (e.g., `activeIncidentsCount`, `handleApproveDispatch()`).

### 10.2 Code Quality & Review Checklist
1. **No Any Types:** All variables, parameters, and return types must be explicitly typed; using `any` will fail the build process.
2. **Strict Component Splitting:** No component file may exceed **300 lines of code**. Large components must be split into clean, modular sub-components.
3. **No Key-Value State Updates inside Component Bodies:** Component state updates must be managed via dedicated custom hooks or state hooks, protecting against infinite re-render loops.
4. **Comprehensive Accessibility tags:** Every button, input, and icon must have complete `aria-label` or role descriptors.

---

## 11. Production Readiness & DevOps Strategy

To transition Stadium Nexus from development to production deployment, we use a containerized pipeline designed to run on scalable cloud services.

```
+--------------------------------------------------------------------------------------------------+
|                              PRODUCTION DEPLOYMENT WORKFLOW                                      |
+--------------------------------------------------------------------------------------------------+
|  Code Push --->  Lint & Typecheck --->  Build Dist Assets --->  Dockerize Image --->  Cloud Run  |
|  (GitHub)        (TypeScript compiler)  (Vite Production Build) (esbuild Backend)     (Deploy)   |
+--------------------------------------------------------------------------------------------------+
```

* **Docker Containerization Strategy:**
  * Uses a multi-stage Dockerfile:
    * **Stage 1 (Build):** Compiles the React static files in `/dist` and bundles the Express backend server into a single file (`dist/server.cjs`) using esbuild.
    * **Stage 2 (Runtime):** A lightweight Node base image containing only the production dependencies and compiled outputs. This keeps the final container tiny, ensuring fast startup times and minimal cold-start delays.
* **Monitoring & Observability:**
  * Integrated health-check endpoint (`GET /api/health`) for container health monitoring.
  * System metrics (API latency, database connection health, AI response success rates) are exposed to cloud-native dashboards.
* **Observability for AI Operations:**
  * Every API call to Gemini is logged with its duration, prompt length, token usage, and parsed schema confidence rating. This tracking helps identify and optimize slower prompts over time.

---

## 12. Implementation Roadmap

We break the development of FIFA Stadium Nexus into five focused phases, maintaining a smooth, iterative build path.

```
       [ PHASE 1 ]            [ PHASE 2 ]            [ PHASE 3 ]            [ PHASE 4 ]            [ PHASE 5 ]
       Base Shell             Telemetry Engine       AI Copilot             Field Integration      Hardening
       - Repo structure       - Live metric feeds    - Gemini pipelines     - Mobile views         - Security audit
       - Theme system         - Live maps            - Recommendation HUD   - Action dispatch      - Scale validation
```

### Phase 1: Base Shell & Design System (Complexity: Low)
* **Goal:** Set up the repository, configure build systems, and implement the design system.
* **Acceptance Criteria:**
  * Clean build with TypeScript compilation and zero linting warnings.
  * The shared UI components (buttons, cards, badges) render correctly with high contrast and smooth micro-animations.
* **Validation Checklist:**
  * [ ] Verified the system compiles successfully using `npm run build`.
  * [ ] Confirmed the Tailwind v4 theme is active and typography renders correctly.

### Phase 2: Telemetry Ingestion & Live Map (Complexity: Medium)
* **Goal:** Implement the raw telemetry ingestion pipeline and build the live spatial crowd heatmap dashboard.
* **Acceptance Criteria:**
  * Ingestion API endpoints process incoming sensor streams without blocking.
  * The GIS/Map component renders live crowd density heatmaps.
* **Validation Checklist:**
  * [ ] Confirmed mock telemetry generator updates the UI in real-time.
  * [ ] Verified map coordinates plot correctly across different zoom levels.

### Phase 3: AI Copilot Integration (Complexity: High)
* **Goal:** Build and integrate the Gemini-powered AI Copilot side-drawer and action recommendation engine.
* **Acceptance Criteria:**
  * Real-time alerts trigger prompt generation and send context queries to the Gemini API.
  * AI-generated recommendations are parsed against JSON schemas and display on the UI with accurate confidence ratings.
* **Validation Checklist:**
  * [ ] Verified AI API calls handle network dropouts gracefully.
  * [ ] Confirmed parsed recommendation payloads match our target schema contracts.

### Phase 4: Field Dispatch & Mobile Handheld Integration (Complexity: Medium)
* **Goal:** Implement role-specific mobile interfaces for security officers and field volunteers.
* **Acceptance Criteria:**
  * Field devices receive instant task dispatch notifications when the TOC Operator approves an AI recommendation.
  * Volunteer mobile clients successfully process missing person and facility incident forms.
* **Validation Checklist:**
  * [ ] Verified task assignments update instantly across desktop and mobile views.
  * [ ] Confirmed offline mobile queueing syncs correctly upon reconnecting.

### Phase 5: Hardening, Security, & Judge Walkthrough (Complexity: Low)
* **Goal:** Conduct security audits, optimize system performance, and set up the interactive judge demonstration sandbox.
* **Acceptance Criteria:**
  * API endpoints enforce strict role-based authorization checks.
  * The demonstration sandbox simulates the complete "Chaos Cascade" to "AI Copilot Resolve" walkthrough, showcasing the platform's value within 30 seconds.
* **Validation Checklist:**
  * [ ] Confirmed the simulation sandbox executes perfectly under demo conditions.
  * [ ] Verified all system-wide inputs are protected against prompt injection attempts.
