/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIAuditEntry } from "./types";

export class AIAuditLayer {
  private static instance: AIAuditLayer | null = null;
  private logs: Map<string, AIAuditEntry> = new Map();

  private constructor() {}

  public static getInstance(): AIAuditLayer {
    if (!AIAuditLayer.instance) {
      AIAuditLayer.instance = new AIAuditLayer();
    }
    return AIAuditLayer.instance;
  }

  /**
   * Log an execution event into the audit ledger.
   */
  public log(entry: AIAuditEntry): void {
    this.logs.set(entry.id, entry);
    console.log(`[AIAuditLayer] Recorded audit entry: ${entry.id}`, {
      promptId: entry.promptId,
      provider: entry.providerId,
      latency: `${entry.latencyMs}ms`,
      validation: entry.validationStatus
    });
  }

  /**
   * Record operator feedback / decision on a generated recommendation.
   */
  public recordDecision(id: string, decision: "APPROVED" | "REJECTED"): void {
    const entry = this.logs.get(id);
    if (entry) {
      entry.operatorDecision = decision;
      entry.operatorDecisionTime = new Date().toISOString();
      this.logs.set(id, entry);
      console.log(`[AIAuditLayer] Logged operator decision: ${decision} for audit entry: ${id}`);
    }
  }

  /**
   * Retrieve an audit entry by ID.
   */
  public getEntry(id: string): AIAuditEntry | undefined {
    return this.logs.get(id);
  }

  /**
   * Get all recorded audit entries.
   */
  public getAllEntries(): AIAuditEntry[] {
    return Array.from(this.logs.values()).sort(
      (a, b) => new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime()
    );
  }

  /**
   * Clears audit log.
   */
  public clear(): void {
    this.logs.clear();
  }
}
