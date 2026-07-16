# FIFA TOC Nexus: Collaborative Real-Time Operations Platform

Welcome to **FIFA TOC Nexus**, a premium, cognitive real-time operations console engineered for the **FIFA World Cup 2026**. Designed for the Tournament Operations Center (TOC), this platform coordinates stadium crowd flows, safety protocols, medical dispatches, transit networks, and environmental conditions across multiple operator terminals simultaneously.

This release includes dedicated **Demo Mode (One-Click Scenario Orchestrator)** and **Judge Presentation Mode (Evaluating Cognitive Impact)** for direct evaluation.

---

## 🚀 Key Features & Architectural Mastery

### 1. Unified Cognitive Flow (End-to-End Integration)
*   **Event-Driven Simulation Engine**: Drives deterministic or custom timelines representing crowd flow velocity, ambient stadium parameters, weather radar changes, and incident logs.
*   **Centralized Event Bus**: Receives high-priority dispatches, triggers reactive UI state maps, and pushes event notifications across all active terminals.
*   **AI Cognitive Runtime (RAG-Enabled)**: Integrates deep context parsing, matching incidents against localized standard operating manuals (Knowledge Layer).
*   **Gemini Strategy Engine**: Orchestrates complex emergency playbooks into clear, multi-tier tactical recommendations with high confidence scores.
*   **Human-In-The-Loop Consent**: Enforces strict operational accountability, requiring human approval before dispatching technical or medical interventions.
*   **Real-Time Live Collaboration Hub**: Features active presence indicators, offline lease-locks, visual cursors, and instant cross-terminal sync.
*   **Immutable Audit Logs**: Tracks every system notification, AI dispatch, and human override action for regulatory debriefings.

### 2. One-Click Scenario Orchestrator (Demo Mode)
Experience 10 distinct, pre-configured live operations scenarios under different workloads and stressors, available at a single click with no manual setup:
1.  **Normal Match (`SC-NORMAL`)**: Typical matchday ingress flow with average queues and nominal security clearances.
2.  **Heavy Crowd Surge (`SC-SOLD-OUT`)**: Sold-out match ingress with critical crowd accumulation at Northern gates.
3.  **Medical Alert (`SC-HEAT`)**: 39°C temperature spike causing medical exhaustions and dehydration alerts across Sector F.
4.  **Security Threat (`SC-HIGH-RISK`)**: High-risk fan friction at East Gate B, activating safety cordons.
5.  **Metro Failure (`SC-STRIKE`)**: Transport station disruption triggering severe queue congestion and transit rerouting.
6.  **Heavy Rain (`SC-RAIN`)**: Microclimate cloudburst requiring immediate gate canopy deployments and umbrella-distribution.
7.  **VIP Arrival (`SC-VIP`)**: Premium delegation ingress requiring active road closures and priority elevator locks.
8.  **Power Failure (`SC-POWER`)**: Substation grid failure switching stadium systems onto auxiliary generator feeds.
9.  **Accessibility (`SC-ACCESS`)**: Inbound high-volume delegation requiring wheelchair-ramps, golf carts, and staff escorting.
10. **Emergency Evacuation (`SC-EVAC`)**: Match suspension and stadium-wide emergency exit routing.

### 3. Judge Presentation View
Toggle **JUDGE VIEW ON** inside the Competition Readiness Center to:
*   **Hide Developer Noise**: Suppresses diagnostic timetables, raw telemetry clocks, and layout configuration options.
*   **Display Clean KPIs**: Shows live **Spectator Safety Index (SLA)**, **Dispatch SLA Compliance**, and **AI Strategy Acceptance Ratio**.
*   **Highlight AI Impact & Outcomes**: Reviews targeted outcomes (e.g. "Saved 1.8 mins response time" or "Reduced turnstile congestion by 42%").
*   **Track Operational Timelines**: Presents a timeline detailing the exact incident raised, Gemini recommendation generated, and human operational approval state.

---

## ♿ WCAG AA Accessibility Standards
Built from the ground up to support accessible venue coordination:
*   **Semantic Structure**: Uses standard landmarks (`<header>`, `<main>`, `<nav>`, `<aside>`) to construct a clear hierarchy.
*   **Keyboard Navigation**: Full support for focus indicators, tab rings, and keyboard-friendly interactive lists.
*   **Skip-To-Content Anchor**: High-visibility link allows screen readers to bypass main header HUD elements instantly.
*   **High-Contrast Color Palette**: Crisp typography conforming to strict WCAG color ratios for low-vision and outdoor sunlight operation.

---

## ⚡ Setup & Execution

FIFA TOC Nexus runs entirely client-side for sandbox-ready preview.

### Prerequisites
*   **Node.js**: v18+ 
*   **Package Manager**: `npm`

### Local Launch
```bash
# 1. Install dependencies
npm install

# 2. Launch the Vite development server
npm run dev
```

The application will bind to the designated port and open a live hot-reloading iframe portal.

---

## 🏆 Final Submission Status
*   **Phase 1-12 Architecture**: Frozen and fully verified.
*   **Phase 13 Production Readiness**: Audited, typed, and signed-off in `PRODUCTION_READINESS.md`.
*   **Release Candidate (RC-1)**: All 10 scenarios and Judge Mode KPI structures fully functional with **zero build errors**.
