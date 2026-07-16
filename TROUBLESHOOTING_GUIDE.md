# FIFA World Cup TOC - Engineering Troubleshooting Guide

## Emergency Triage Flow Chart
In the event of system degradation, follow this ordered checklist to locate and fix the underlying issue:

```
                  [ SYSTEM ANOMALY DETECTED ]
                               │
            Is the Diagnostics status card FAILING?
               /                         \
             YES                          NO
             /                             \
[Check specific component logs]      [Inspect browser console errors]
```

---

## 1. Gemini API / LLM Failures (SLA Breaches)

### Issue:
AI recommendation panels remain blank, or show persistent "Inference Pipeline Execution Aborted" error banners.

### Root Causes:
* **API Key Unconfigured:** The `GEMINI_API_KEY` secret was modified, deleted, or expired.
* **Rate Limits Exceeded (HTTP 429):** High event volumes have exhausted the model's standard minute quota.
* **Network Connectivity Block:** The hosting server cannot route packets to Google's API endpoints.

### Mitigation:
1. Open the **Engineering Diagnostics Sidebar**.
2. Locate the **Gemini Provider** status card. If status reads `FAILING`, check the associated error message.
3. Open the **Console Settings** and test an AI prompt manually using the **AI Pipeline Playground**.
4. If a `429` error is visible, toggle the Gemini Provider into fallback/offline mode in settings to allow deterministic, manual incident resolution.
5. In Cloud Run, verify that your service secrets possess appropriate IAM permissions to fetch the active API credential.

---

## 2. Knowledge Retrieval (RAG) Failure

### Issue:
Synthesized AI plans contain generic recommendations and lack specific stadium Gate SOP numbers (e.g., SOP-09 is missing).

### Root Causes:
* **Vector Store Database Lockout:** The local/remote vector storage index is experiencing high write contention or transient disconnects.
* **Index Out of Sync:** Document schemas have been modified without re-indexing historical SOP texts.

### Mitigation:
1. On the **Diagnostics Dashboard**, locate the **KnowledgeLayer** health card.
2. If status reads `DEGRADED`, verify that the primary document store is accessible.
3. Try injecting a test RAG retrieval query inside the **Failure Injection Lab** to measure exact milliseconds latencies.
4. If database locks are detected, trigger a soft re-index by executing the **Restore RAG Index** routine in the lab to rebuild memory maps.

---

## 3. Simulation Timeline Desynchronization

### Issue:
The simulation timeline ticks stop advancing, or spectator wait times on the layout freeze.

### Root Causes:
* **Background Thread Throttle:** The browser or background tab has throttled execution timers to conserve physical device memory.
* **Unhandled React Hook Error:** A state update cycle triggered an infinite render sequence, crashing the virtual DOM.

### Mitigation:
1. Open the **Browser Developer Tools** (F12) and inspect the Console tab.
2. Check if a `React error` or unhandled promise rejection has stalled the UI threads.
3. Open the **Diagnostics Dashboard** and check the **SIM TICK INDEX** counter. If the tick number is not increasing, the engine has stalled.
4. Try reloading the console, or adjust the **Simulated Timeline Tick rate** in the Settings tab to restore clock triggers.

---

## 4. Multi-Role Collaboration Sync Drops

### Issue:
The secondary workspace indicator displays "OFFLINE," or modifications made by peer commanders do not appear on your active HUD screen.

### Root Causes:
* **Websocket/Poller Timeout:** The client lost websocket handshakes or peer connection states due to local network handoffs.
* **State Merge Conflicts:** Concurrent Gold Commander overrides cannot resolve state reconciliation loops.

### Mitigation:
1. Navigate to the bottom right of the sidebar and check the **Collaboration Synchronization** indicator.
2. If the connection reads "DISCONNECTED," click the reconnect widget to retry the handshake.
3. Open the **Diagnostics Dashboard** and check the **Structured Logs Terminal** filtering by level `WARN` or `ERROR` to find any `CollaborationService` sync anomalies.
4. If merge conflicts persist, clear the local cache by refreshing the page to allow the central hub to authoritatively re-align the workspace state.
