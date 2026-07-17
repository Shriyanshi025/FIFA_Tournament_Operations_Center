# FIFA TOC Nexus: Collaborative Real-Time Tournament Operations Center

FIFA TOC Nexus is a premium, cognitive real-time operations console engineered for the **FIFA World Cup 2026**. Designed for the Tournament Operations Center (TOC), it orchestrates stadium crowd flows, safety protocols, medical dispatches, transit networks, and environmental conditions across multiple operator terminals simultaneously.

---

## 🏆 Project Overview & Value Proposition
In mega-scale sports tournaments like the FIFA World Cup, operational delays of even a few minutes can lead to catastrophic crowd surges, critical medical incidents, or severe transport gridlock. **FIFA TOC Nexus** bridges the gap between raw stadium IoT telemetry and operational response. By combining a real-time event-driven engine with the **Google Gemini SDK**, TOC Nexus provides predictive recommendations that operators can evaluate, approve, or override with human-in-the-loop accountability.

---

## ⚠️ The Problem Statement
Stadium operations center leaders face a staggering volume of disconnected telemetry inputs during match days:
1. **Data Silos**: Turnstile rates, security queues, medical reports, transit schedules, and microclimate radars operate on separate systems.
2. **Cognitive Overload**: When multiple incidents happen simultaneously (e.g. a metro breakdown coinciding with a crowd surge), operators struggle to quickly apply Standard Operating Procedures (SOPs).
3. **Auditability Gaps**: Decisions made in high-stress environments lack secure, cryptographic audit trails for post-match debriefings.

---

## 💡 The Solution
**FIFA TOC Nexus** unifies stadium operations into a single interactive cockpit:
* **Event-Driven Command Center**: Aggregates disparate telemetry data into real-time visual alerts and maps.
* **Cognitive Decision Support**: Leverages RAG (Retrieval-Augmented Generation) against stadium SOP handbooks using Gemini to propose structured operational plans.
* **Human-In-The-Loop Consent**: Safeguards stadium operations by ensuring all AI recommendations require a physical operator's approval before deployment.
* **State-Sync Collaboration**: Ensures multi-terminal operator synchronization with visual cursors, online lease-locks, and presence indicators.

---

## 🤖 Google Gemini AI Integration
The cognitive heart of TOC Nexus is powered by the **Google Gemini SDK** (`@google/genai`):
1. **RAG-Driven Prompting**: The system queries a specialized Knowledge Layer containing official stadium emergency handbooks, matching the active incident context.
2. **Structured Outputs**: Prompts are formatted to return structured JSON payloads specifying:
   - **Tactical Playbook Title & Rationale**
   - **Recommended Actions** (e.g. turnstile redirection, volunteer dispatch)
   - **Expected SLA Impacts** (e.g. target queue wait reductions)
   - **AI Confidence Scores**
3. **Graceful Failover Matrix**: Includes simulated offline/rate-limit recovery (429/500 errors) that automatically falls back to local edge diagnostics and notifies operations of degraded provider states.

---

## 🏗️ Architecture & Core Layers
```
┌────────────────────────────────────────────────────────┐
│               TOC OPERATOR WORKSPACE (UI)              │
│       Dashboard  •  Map  •  Incidents  •  Diagnostics  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│           REAL-TIME EVENT BUS (Pub/Sub Engine)         │
│  Match Events  •  Crowd Densities  •  Incident Dispatches│
└───────────────────────────┬────────────────────────────┘
                            ▼
┌───────────────────────────┴────────────────────────────┐
│                  COGNITIVE AI RUNTIME                  │
│   Knowledge SOPs (RAG)  ◄──►  Google Gemini Provider    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌───────────────────────────┴────────────────────────────┐
│               DECISION WORKFLOW ENGINE                 │
│      Audit Ledger Logs   ◄──►   Operator Consent Gate   │
└────────────────────────────────────────────────────────┘
```

* **Event Bus**: An in-memory publisher-subscriber hub coordinating cross-component updates.
* **Simulation Flight Deck**: A deterministic scenario simulator running time dilation cycles to model ingress/egress dynamics.
* **Live Collaboration Layer**: Emulates operational presence leasing, preventing conflicting operator commands on active incidents.

---

## ✨ Features
* **Interactive Spatial Map Overlay**: Clickable sector map overlays showcasing real-time gate processing rates, queue counts, and turnstile wait times.
* **One-Click Live Scenarios**: 10 pre-configured match-day scenarios ranging from a normal match loop to critical metro failures, crowd surges, and emergency evacuations.
* **Competition Presentation Mode (Judge View)**: A clean view toggle that simplifies layout details to showcase high-level KPIs, AI strategy acceptance ratios, and SLA impact metrics.
* **SLA Observability Logs**: A structured log terminal featuring chronological logging of all system notifications, incident lifecycles, and operator overrides.

---

## 🛠️ Tech Stack
* **Framework**: React 19, TypeScript
* **Styling**: Vanilla CSS, Tailwind CSS
* **Build System**: Vite 6, ESBuild
* **AI Orchestration**: Google Gemini SDK (`@google/genai`)
* **Icons**: Lucide React
* **Runtime**: Node.js & Express

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js**: Version 18 or above
* **Package Manager**: npm

### Installation Steps
1. Clone the repository and navigate to the project directory:
   ```bash
   npm install
   ```
2. Set your environment variables (optional for simulation mode):
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:3000`.

---

## 🏆 Demo Guide for Judges

Follow these steps to experience the full operational lifecycle of TOC Nexus:

### Step 1: Initialize the Scenario
1. Under the **Simulation Flight Deck** on the main dashboard, select a scenario from the dropdown (e.g. **Sold Out Attendance Peak** or **Metro Transit Strike**).
2. Click **Deploy Selected Scenario** and press **Resume** to begin the virtual simulation timeline.
3. Observe the turnstile flow rates and sector heat levels changing in the **Ingress Gate Flows** panel.

### Step 2: Evaluate AI Recommendations
1. Navigate to the **Incident Registry** on the left menu.
2. View the automatically generated alerts under **Live Incident Registry**.
3. Under the **AI Copilot** recommendations section, examine the plan suggested by the Gemini Engine. 
4. Approve the recommendation to execute turnstile rerouting, and verify the incident status transitions to **RESOLVED**.

### Step 3: Audit System Observability
1. Open the **Engineering Diagnostics** page.
2. Review the **Latency Telemetry Analyzer** and the **Observed Structured Logs Terminal** to audit the cryptographic trace logs recorded for the approved scenario actions.

### Step 4: Access the Judge View
1. Toggle the **Audit Suite Switch** to **ON** at the top of the main dashboard.
2. Review the purified KPI cards showcasing **SLA Compliance**, **AI Acceptance**, and **Spectator Safety Index** tailored for executive review.

---

## 📂 Folder Structure
```
├── server.ts              # Express web server configuration
├── tsconfig.json          # TypeScript compilation settings
├── vite.config.ts         # Vite bundler configuration
└── src/
    ├── main.tsx           # Client entrypoint
    ├── App.tsx            # Main Application Shell
    ├── index.css          # CSS variable styling system
    ├── components/        # Reusable UI widgets & dashboard cards
    ├── context/           # Tournament & Collaboration state providers
    ├── layout/            # Page Header, Sidebar, and Breadcrumb structures
    ├── pages/             # App views (Dashboard, Map, Incidents, Settings)
    ├── services/          # EventBus, Gemini SDK integration, mock layers
    ├── types/             # TypeScript interfaces for tournament state
    └── utils/             # Loggers & validation helpers
```

---

## 🔮 Future Scope
1. **Live Camera Feeds**: Integration with computer-vision models to automatically count queue length in real-time.
2. **Predictive Simulation**: Utilizing historical match data to train models that forecast crowd bottlenecks 30 minutes before they occur.
3. **Cross-Agency Dispatch**: Direct API integrations to automatically notify local municipal transit and emergency response units of stadium incidents.
