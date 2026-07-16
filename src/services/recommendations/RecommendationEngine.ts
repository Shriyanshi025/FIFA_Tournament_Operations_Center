/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockDb } from "../../repositories/mock";
import { EventBus } from "../eventBus";
import { telemetry } from "../observability";
import { AppEvent, EventCategory, EventType } from "../../types/events";
import { Match, Weather, Incident } from "../../types";
import { DecisionState, ActionPriority } from "../../types/ai";
import { ContextBuilder } from "../aiRuntime/contextBuilder";
import { AIRequestManager } from "../aiRuntime/requestManager";
import { KnowledgeRetrievalEngine } from "../knowledge/retrievalEngine";
import { InMemoryKnowledgeRepository } from "../knowledge/repository";
import { MockEmbeddingProvider } from "../knowledge/embeddings";
import { AIRequestContext } from "../aiRuntime/types";
import {
  EnhancedRecommendation,
  RecommendationType,
  RecommendationStatus,
  ReviewAction,
  RecommendationExplanation,
  RankingMetrics,
  RecommendationConflict,
  RecommendationAuditLog,
  SuccessMetrics
} from "./types";

export class RecommendationEngine {
  private static instance: RecommendationEngine | null = null;
  private recommendations: EnhancedRecommendation[] = [];
  private metrics: SuccessMetrics;
  private eventBusSubIds: string[] = [];
  private retrievalEngine: KnowledgeRetrievalEngine;

  private constructor() {
    this.metrics = this.getDefaultMetrics();
    // Initialize Knowledge Retrieval with InMemory Repository and Mock Embeddings as default
    const repo = new InMemoryKnowledgeRepository();
    const embedProvider = new MockEmbeddingProvider();
    this.retrievalEngine = new KnowledgeRetrievalEngine(repo, embedProvider);
    
    this.syncWithMockDatabase();
  }

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * Resets singleton state (useful for simulations and tests)
   */
  public static resetInstance(): void {
    if (RecommendationEngine.instance) {
      RecommendationEngine.instance.unsubscribeFromEventBus();
    }
    RecommendationEngine.instance = null;
  }

  private getDefaultMetrics(): SuccessMetrics {
    return {
      totalGenerated: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalExecuted: 0,
      acceptanceRate: 0,
      averageExecutionTimeMinutes: 0,
      recommendationAccuracy: 0,
      falsePositivesCount: 0,
      falseNegativesCount: 0,
      operatorOverridesCount: 0,
      averageConfidence: 0,
      averageOperationalImpact: 0
    };
  }

  /**
   * Warm-up and load pre-existing seed recommendations from Mock DB
   */
  public async syncWithMockDatabase(): Promise<void> {
    try {
      const existing = await mockDb.recommendations.getAll();
      this.recommendations = existing.map(rec => {
        // Hydrate to EnhancedRecommendation if not already enriched
        const enhanced = rec as unknown as EnhancedRecommendation;
        
        // Supply defaults for missing Phase 8 rich fields
        if (!enhanced.type) enhanced.type = RecommendationType.CROWD;
        if (!enhanced.lifecycleStatus) {
          enhanced.lifecycleStatus = rec.status === DecisionState.APPROVED 
            ? RecommendationStatus.APPROVED 
            : rec.status === DecisionState.REJECTED 
              ? RecommendationStatus.REJECTED 
              : RecommendationStatus.PENDING_REVIEW;
        }
        if (!enhanced.explanation) {
          enhanced.explanation = {
            summary: rec.reason || "Seeded standard recommendation.",
            reasoning: rec.reason || "Pre-defined by system templates.",
            supportingEvidence: rec.evidence || [],
            knowledgeSourcesUsed: [],
            confidence: rec.confidenceScore,
            expectedOutcome: rec.expectedOutcome || "Optimize operations.",
            potentialRisks: ["Minor workflow disruption during rollout."],
            alternativeOptions: ["Maintain baseline deployment levels."],
            estimatedResolutionTime: 15,
            affectedAreas: ["Stadium Sector General"]
          };
        }
        if (!enhanced.ranking) {
          enhanced.ranking = this.calculateRanking(rec.priority, rec.confidenceScore, 6);
        }
        if (!enhanced.conflicts) enhanced.conflicts = [];
        if (!enhanced.auditTrail) {
          enhanced.auditTrail = [
            {
              id: `AUD-SEED-${Math.floor(Math.random() * 1000000)}`,
              recommendationId: rec.id,
              timestamp: rec.createdAt || new Date().toISOString(),
              actor: "SYSTEM",
              action: "CREATE",
              notes: "Seeded from database."
            }
          ];
        }
        return enhanced;
      });

      this.metrics.totalGenerated = this.recommendations.length;
      this.updateSuccessMetrics("sync", {} as any);
    } catch (err) {
      console.error("[RecommendationEngine] Syncing database failed:", err);
    }
  }

  /**
   * Subscribe to relevant simulation and operational events on the EventBus
   */
  public subscribeToEventBus(): void {
    if (this.eventBusSubIds.length > 0) return;

    const eventBus = EventBus.getInstance();

    const subs = [
      eventBus.subscribe(EventType.IncidentCreated, (e) => this.handleSimulationEvent(e)),
      eventBus.subscribe(EventType.CrowdDensityChanged, (e) => this.handleSimulationEvent(e)),
      eventBus.subscribe(EventType.GateQueueUpdated, (e) => this.handleSimulationEvent(e)),
      eventBus.subscribe(EventType.WeatherUpdated, (e) => this.handleSimulationEvent(e)),
      eventBus.subscribe(EventType.TransportUpdated, (e) => this.handleSimulationEvent(e))
    ];

    this.eventBusSubIds = subs.map(sub => sub.id);
    console.log("[RecommendationEngine] EventBus subscriptions active.");
  }

  /**
   * Unsubscribe from EventBus
   */
  public unsubscribeFromEventBus(): void {
    const eventBus = EventBus.getInstance();
    this.eventBusSubIds.forEach(id => eventBus.unsubscribe(id));
    this.eventBusSubIds = [];
    console.log("[RecommendationEngine] EventBus subscriptions cancelled.");
  }

  /**
   * Retrieve all cached enhanced recommendations
   */
  public getAllRecommendations(): EnhancedRecommendation[] {
    return [...this.recommendations];
  }

  /**
   * Retrieve specific recommendation by ID
   */
  public getRecommendationById(id: string): EnhancedRecommendation | null {
    const rec = this.recommendations.find(r => r.id === id);
    return rec ? { ...rec } : null;
  }

  /**
   * Retrieve the active success and accuracy metrics
   */
  public getSuccessMetrics(): SuccessMetrics {
    return { ...this.metrics };
  }

  /**
   * Orchestrates the complete Operational Intelligence Pipeline:
   * Event -> Context -> Knowledge Retrieval -> Prompt -> AI Runtime -> Validation -> Confidence -> Recommendation
   */
  public async handleSimulationEvent(event: AppEvent): Promise<EnhancedRecommendation | null> {
    const endMeasure = telemetry.startTimer("recommendation_generation");
    console.log(`[RecommendationEngine] Triggering pipeline on event: ${event.type}`);
    
    // 1. Build Context
    let context: AIRequestContext;
    try {
      context = await ContextBuilder.buildContext();
    } catch (err) {
      console.error("[RecommendationEngine] Failed to build context snapshot:", err);
      return null;
    }

    // 2. Map event to AI Prompt template & construct parameters
    const promptMapping = this.mapEventToPrompt(event, context);
    if (!promptMapping) {
      console.log(`[RecommendationEngine] Event ${event.type} does not map to any active operational prompt template.`);
      return null;
    }

    const { promptId, parameters } = promptMapping;

    // 3. Perform RAG Knowledge Retrieval using the incident details or event metrics
    let retrievedSOPs = "";
    let knowledgeAssetIds: string[] = [];
    try {
      const queryText = event.type === EventType.IncidentCreated
        ? `${(event.payload as any).incident.title} ${(event.payload as any).incident.description}`
        : `${event.type} at Sector/Zone ${parameters.gateId || "General"}`;

      const ragContext = await this.retrievalEngine.retrieve({ text: queryText, limit: 2 });
      retrievedSOPs = ragContext.formattedContextText;
      knowledgeAssetIds = ragContext.retrievedDocs.map(d => d.asset.id);
    } catch (err) {
      console.warn("[RecommendationEngine] RAG Retrieval failed, executing with default knowledge:", err);
    }

    // Add RAG SOP context into prompt parameters
    parameters.knowledgeSOPs = retrievedSOPs || "No specific SOP found. Rely on standard stadium protocols.";

    // 4. Execute AI Request via AIRequestManager
    // Use "google-gemini" if an API key is available, else use "local-model" to avoid runtime crashes
    const hasApiKey = this.isApiKeyConfigured();
    const providerId = hasApiKey ? "google-gemini" : "local-model";

    try {
      const priority = event.metadata.priority === "CRITICAL" || event.metadata.priority === "HIGH" ? "HIGH" : "MEDIUM";
      
      const response = await AIRequestManager.getInstance().executeRequest<any>({
        promptId,
        parameters,
        priority,
        correlationId: event.metadata.correlationId
      }, providerId);

      const parsed = response.parsedData;

      // 5. Build rich recommendation schema
      const recId = parsed.recommendationId || `REC-AI-${Math.floor(Math.random() * 100000)}`;
      const mappedPriority = event.metadata.priority === "CRITICAL" ? ActionPriority.HIGH : event.metadata.priority === "HIGH" ? ActionPriority.HIGH : ActionPriority.MEDIUM;
      
      const ranking = this.calculateRanking(
        mappedPriority,
        response.confidence.overallScore,
        parsed.confidenceScore ? Math.round(parsed.confidenceScore * 10) : undefined
      );

      const explanation: RecommendationExplanation = {
        summary: parsed.rationale || parsed.reason || `Tactical override directive at ${parameters.gateId || "stadium sectors"}.`,
        reasoning: parsed.rationale || parsed.reason || "Evaluated by AI pipeline using operational RAG contexts and active telemetry.",
        supportingEvidence: parsed.evidence || [event.type, `Zone Density: ${parameters.zoneDensity || "N/A"}`, `Wait Time: ${parameters.averageWaitTime || "N/A"} mins`],
        knowledgeSourcesUsed: knowledgeAssetIds,
        confidence: response.confidence.overallScore,
        expectedOutcome: parsed.expectedOutcome || parsed.action || "Mitigate threat and restore stable stadium flow.",
        potentialRisks: parsed.potentialRisks || ["Slightly increased congestion in neighboring sectors."],
        alternativeOptions: parsed.alternativeOptions || ["Manual redirection and pacing patrols."],
        estimatedResolutionTime: parsed.estimatedEffectMinutes || parsed.congestionResolutionTimeMinutes || 15,
        affectedAreas: parsed.affectedAreas || [parameters.gateId || "General Complex"]
      };

      const baseRec: EnhancedRecommendation = {
        id: recId,
        incidentId: event.type === EventType.IncidentCreated ? (event.payload as any).incident.id : undefined,
        title: parsed.title || `Operational Directive: ${parameters.gateId || "General"}`,
        reason: parsed.rationale || parsed.reason || "Formulated against live telemetry.",
        evidence: explanation.supportingEvidence,
        recommendedAction: parsed.action || parsed.recommendedAction || "Redistribute stewards and notify ticket scanners.",
        expectedOutcome: explanation.expectedOutcome,
        confidenceScore: response.confidence.overallScore,
        priority: mappedPriority,
        status: DecisionState.PENDING,
        createdAt: new Date().toISOString(),
        type: this.mapPromptToRecType(promptId),
        lifecycleStatus: RecommendationStatus.PENDING_REVIEW,
        explanation,
        ranking,
        conflicts: [],
        auditTrail: []
      };

      // Add default Audit Trail
      baseRec.auditTrail.push({
        id: `AUD-${Math.floor(Math.random() * 1000000)}`,
        recommendationId: baseRec.id,
        timestamp: baseRec.createdAt,
        actor: "AI_SYSTEM",
        action: "CREATE",
        notes: `Recommendation automatically drafted from Event: ${event.type}`
      });

      // 6. Deduplication and Superseding
      const dedupResult = this.handleDeduplication(baseRec, this.recommendations);
      if (!dedupResult.shouldInsert) {
        console.log(`[RecommendationEngine] Recommendation ${baseRec.id} omitted as a redundant duplicate.`);
        return null;
      }

      let finalRec = dedupResult.mergedRecommendation || baseRec;

      // Handle superseded entries
      for (const oldId of dedupResult.supersededIds) {
        const oldIdx = this.recommendations.findIndex(r => r.id === oldId);
        if (oldIdx !== -1) {
          const old = this.recommendations[oldIdx];
          old.lifecycleStatus = RecommendationStatus.EXPIRED;
          old.status = DecisionState.REJECTED;
          old.supersededBy = finalRec.id;
          old.auditTrail.push({
            id: `AUD-${Math.floor(Math.random() * 1000000)}`,
            recommendationId: old.id,
            timestamp: new Date().toISOString(),
            actor: "AI_SYSTEM",
            action: "UPDATE",
            notes: `Superseded by higher priority/score recommendation ${finalRec.id}`
          });

          await mockDb.recommendations.update(old.id, {
            status: DecisionState.REJECTED,
            resolvedAt: new Date().toISOString()
          } as any);
        }
      }

      if (dedupResult.supersededIds.length > 0) {
        finalRec.supersedes = dedupResult.supersededIds[0];
      }

      // 7. Run Conflict Detection against active list
      finalRec.conflicts = this.detectConflicts(finalRec, this.recommendations);

      // Save in-memory cache
      this.recommendations.push(finalRec);

      // Save to Mock DB so UI and other services are updated!
      await mockDb.recommendations.create({
        id: finalRec.id,
        incidentId: finalRec.incidentId,
        title: finalRec.title,
        reason: finalRec.reason,
        evidence: finalRec.evidence,
        recommendedAction: finalRec.recommendedAction,
        expectedOutcome: finalRec.expectedOutcome,
        confidenceScore: finalRec.confidenceScore,
        priority: finalRec.priority,
        status: finalRec.status,
        createdAt: finalRec.createdAt
      });

      // Update success metrics
      this.updateSuccessMetrics("create", finalRec);

      // Publish on EventBus
      EventBus.getInstance().publish(
        EventType.RecommendationGenerated,
        EventCategory.AI,
        { recommendation: finalRec as any },
        "AI_RECOMMENDATION_ENGINE"
      );

      const elapsed = endMeasure();
      telemetry.incrementMetric("recommendationsGenerated");
      telemetry.reportComponentStatus("RecommendationEngine", "OK", elapsed);
      telemetry.log("INFO", `Recommendation ${finalRec.id} generated successfully.`, {
        incidentId: finalRec.incidentId,
        priority: finalRec.priority,
        durationMs: elapsed
      }, { correlationId: event.metadata.correlationId });

      console.log(`[RecommendationEngine] Recommendation ${finalRec.id} generated successfully.`);
      return finalRec;

    } catch (err: any) {
      const elapsed = endMeasure();
      telemetry.reportComponentStatus("RecommendationEngine", "FAILING", elapsed, err.message);
      telemetry.log("ERROR", "Pipeline execution crash inside RecommendationEngine", {
        error: err.message || String(err),
        durationMs: elapsed
      }, { correlationId: event.metadata.correlationId });

      console.error("[RecommendationEngine] Pipeline execution crash:", err);
      return null;
    }
  }

  /**
   * Human approval queue: Approve action
   */
  public async approve(id: string, operatorId: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    
    // Calculate human response time (latency)
    const creationTime = new Date(rec.createdAt).getTime();
    const approvedDurationMs = Date.now() - creationTime;
    telemetry.recordLatency("human_approval", approvedDurationMs);
    telemetry.incrementMetric("humanApprovalsProcessed");

    rec.lifecycleStatus = RecommendationStatus.APPROVED;
    rec.status = DecisionState.APPROVED;
    rec.operatorId = operatorId;

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: operatorId,
      action: "APPROVE",
      notes: "Recommendation approved by operator."
    });

    // Update memory
    this.updateLocalRecommendation(rec);

    // Save database
    await mockDb.recommendations.update(rec.id, {
      status: DecisionState.APPROVED,
      operatorId
    } as any);

    this.updateSuccessMetrics("approve", rec);

    // Publish event
    EventBus.getInstance().publish(
      EventType.RecommendationApproved,
      EventCategory.OPERATIONAL,
      { recommendationId: rec.id, approvedAt: new Date().toISOString() },
      operatorId
    );

    return rec;
  }

  /**
   * Human approval queue: Reject action
   */
  public async reject(id: string, operatorId: string, reason?: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    rec.lifecycleStatus = RecommendationStatus.REJECTED;
    rec.status = DecisionState.REJECTED;
    rec.operatorId = operatorId;

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: operatorId,
      action: "REJECT",
      notes: `Rejected by operator. Reason: ${reason || "None specified"}`
    });

    this.updateLocalRecommendation(rec);

    await mockDb.recommendations.update(rec.id, {
      status: DecisionState.REJECTED,
      operatorId
    } as any);

    this.updateSuccessMetrics("reject", rec);

    EventBus.getInstance().publish(
      EventType.RecommendationRejected,
      EventCategory.OPERATIONAL,
      { recommendationId: rec.id, rejectedAt: new Date().toISOString(), reason },
      operatorId
    );

    return rec;
  }

  /**
   * Human approval queue: Request Revision action
   */
  public async requestRevision(id: string, operatorId: string, notes: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    rec.lifecycleStatus = RecommendationStatus.DRAFT;
    rec.status = DecisionState.MODIFIED;
    rec.revisionNotes = notes;

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: operatorId,
      action: "REQUEST_REVISION",
      notes: `Revision requested. Notes: ${notes}`
    });

    this.updateLocalRecommendation(rec);

    await mockDb.recommendations.update(rec.id, {
      status: DecisionState.MODIFIED,
      reason: `${rec.reason} (Revision: ${notes})`
    } as any);

    this.updateSuccessMetrics("revision", rec);
    return rec;
  }

  /**
   * Human approval queue: Escalate action
   */
  public async escalate(id: string, operatorId: string, notes: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    rec.lifecycleStatus = RecommendationStatus.PENDING_REVIEW;
    rec.priority = ActionPriority.HIGH;
    rec.ranking.priority = 9;
    rec.ranking.overallScore = Math.min(100, rec.ranking.overallScore + 15);

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: operatorId,
      action: "ESCALATE",
      notes: `Escalated to higher operational command tier. Notes: ${notes}`
    });

    this.updateLocalRecommendation(rec);

    await mockDb.recommendations.update(rec.id, {
      priority: ActionPriority.HIGH
    } as any);

    this.updateSuccessMetrics("escalate", rec);
    return rec;
  }

  /**
   * Human approval queue: Delegate action
   */
  public async delegate(id: string, operatorId: string, assigneeId: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    rec.assignedTo = assigneeId;

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: operatorId,
      action: "DELEGATE",
      notes: `Delegated operational task accountability to steward group: ${assigneeId}`
    });

    this.updateLocalRecommendation(rec);
    this.updateSuccessMetrics("delegate", rec);
    return rec;
  }

  /**
   * Marks a recommendation as fully Executed (concludes lifecycle)
   */
  public async execute(id: string, operatorId: string): Promise<EnhancedRecommendation> {
    const rec = this.getRequiredRecommendation(id);
    rec.lifecycleStatus = RecommendationStatus.EXECUTED;
    rec.resolvedAt = new Date().toISOString();

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: rec.resolvedAt,
      actor: operatorId,
      action: "EXECUTE",
      notes: "Recommendation actions executed successfully on stadium floor."
    });

    this.updateLocalRecommendation(rec);

    await mockDb.recommendations.update(rec.id, {
      status: DecisionState.APPROVED,
      resolvedAt: rec.resolvedAt
    } as any);

    this.updateSuccessMetrics("execute", rec);
    return rec;
  }

  /**
   * Submits quality and accuracy feedback score on a recommendation
   */
  public submitFeedback(id: string, score: number, comment?: string): EnhancedRecommendation {
    const rec = this.getRequiredRecommendation(id);
    rec.feedbackScore = score;
    rec.feedbackText = comment;

    rec.auditTrail.push({
      id: `AUD-${Math.floor(Math.random() * 1000000)}`,
      recommendationId: rec.id,
      timestamp: new Date().toISOString(),
      actor: "OPERATOR",
      action: "FEEDBACK",
      notes: `Feedback score: ${score}/5. Comment: ${comment || "None"}`
    });

    this.updateLocalRecommendation(rec);
    this.updateSuccessMetrics("feedback", rec);
    return rec;
  }

  /**
   * Calculates weighted priority ranking scores
   */
  public calculateRanking(
    priority: ActionPriority,
    confidenceScore: number,
    overrideImpact?: number
  ): RankingMetrics {
    let priorityVal = 5;
    if (priority === ActionPriority.HIGH) priorityVal = 8;
    if (priority === ActionPriority.LOW) priorityVal = 3;

    const confidenceVal = Math.round(confidenceScore * 10);
    const operationalImpact = overrideImpact || (priority === ActionPriority.HIGH ? 9 : priority === ActionPriority.MEDIUM ? 6 : 4);
    const timeSensitivity = priority === ActionPriority.HIGH ? 9 : 5;
    const resourceCost = priority === ActionPriority.HIGH ? 4 : 6;
    const riskReduction = priority === ActionPriority.HIGH ? 9 : 5;

    // weighting factors: Priority (30%), Confidence (20%), Operational Impact (20%), Time Sensitivity (15%), Risk Reduction (15%), Cost (-10% penalty)
    const weightedSum = (
      0.3 * priorityVal +
      0.2 * confidenceVal +
      0.2 * operationalImpact +
      0.15 * timeSensitivity +
      0.15 * riskReduction -
      0.1 * resourceCost
    );
    const overallScore = Math.min(100, Math.max(0, Math.round(weightedSum * 10)));

    return {
      priority: priorityVal,
      confidence: confidenceScore,
      operationalImpact,
      timeSensitivity,
      resourceCost,
      riskReduction,
      overallScore
    };
  }

  /**
   * Multi-variable Conflict Detection
   */
  public detectConflicts(newRec: EnhancedRecommendation, existingRecs: EnhancedRecommendation[]): RecommendationConflict[] {
    const conflicts: RecommendationConflict[] = [];

    for (const other of existingRecs) {
      if (other.id === newRec.id) continue;
      if (
        other.lifecycleStatus !== RecommendationStatus.PENDING_REVIEW &&
        other.lifecycleStatus !== RecommendationStatus.APPROVED &&
        other.lifecycleStatus !== RecommendationStatus.EXECUTED
      ) {
        continue;
      }

      // 1. Contradictory recommendations for the same incident/target
      if (newRec.incidentId && other.incidentId && newRec.incidentId === other.incidentId) {
        if (newRec.recommendedAction.toLowerCase() !== other.recommendedAction.toLowerCase()) {
          conflicts.push({
            id: `CONF-CONT-${Math.random().toString(36).substring(2, 11)}`,
            type: "CONTRADICTORY",
            recommendationIds: [newRec.id, other.id],
            description: `Contradictory actions proposed for Incident ${newRec.incidentId}: "${newRec.title}" vs "${other.title}"`,
            severity: "HIGH",
            resolutionAction: "Select the recommendation with higher overall confidence and ranking score."
          });
        }
      }

      // 2. Resource double-allocation conflicts
      const resourcesA = this.extractResources(newRec.recommendedAction);
      const resourcesB = this.extractResources(other.recommendedAction);
      const overlapping = resourcesA.filter(r => resourcesB.includes(r));
      if (overlapping.length > 0) {
        conflicts.push({
          id: `CONF-RES-${Math.random().toString(36).substring(2, 11)}`,
          type: "RESOURCE",
          recommendationIds: [newRec.id, other.id],
          description: `Resource double-allocation detected! Both recommendations require: ${overlapping.join(", ")}`,
          severity: "CRITICAL",
          resolutionAction: `Stagger execution or assign alternate groups. "${newRec.title}" has priority ${newRec.priority} vs "${other.title}" with priority ${other.priority}.`
        });
      }

      // 3. Timing overlaps within same sector
      if (this.haveOverlappingAreas(newRec, other) && newRec.explanation.estimatedResolutionTime > 15 && other.explanation.estimatedResolutionTime > 15) {
        conflicts.push({
          id: `CONF-TIME-${Math.random().toString(36).substring(2, 11)}`,
          type: "TIMING",
          recommendationIds: [newRec.id, other.id],
          description: `Overlapping execution in sector ${newRec.explanation.affectedAreas.join(", ")}. Dual high-duration procedures may lead to local bottlenecks.`,
          severity: "LOW",
          resolutionAction: "Reschedule one recommendation to follow the other sequentially."
        });
      }

      // 4. Priority conflicts
      if (newRec.priority !== other.priority && this.haveOverlappingAreas(newRec, other)) {
        conflicts.push({
          id: `CONF-PRIO-${Math.random().toString(36).substring(2, 11)}`,
          type: "PRIORITY",
          recommendationIds: [newRec.id, other.id],
          description: `Priority disparity in overlapping sectors: "${newRec.title}" (${newRec.priority}) overlaps with "${other.title}" (${other.priority}).`,
          severity: "MEDIUM",
          resolutionAction: `Pause or defer the lower-priority action "${other.title}" to clear the critical sector.`
        });
      }
    }

    return conflicts;
  }

  /**
   * Deduplication and Superseding merges
   */
  public handleDeduplication(newRec: EnhancedRecommendation, existingRecs: EnhancedRecommendation[]): {
    supersededIds: string[];
    shouldInsert: boolean;
    mergedRecommendation?: EnhancedRecommendation;
  } {
    const supersededIds: string[] = [];

    for (const other of existingRecs) {
      if (other.id === newRec.id) continue;
      if (other.lifecycleStatus !== RecommendationStatus.PENDING_REVIEW && other.lifecycleStatus !== RecommendationStatus.DRAFT) {
        continue;
      }

      // Match target incidents
      if (newRec.incidentId && other.incidentId && newRec.incidentId === other.incidentId) {
        if (newRec.ranking.overallScore >= other.ranking.overallScore) {
          supersededIds.push(other.id);
        } else {
          return { supersededIds: [], shouldInsert: false };
        }
      }

      // Match high action similarity -> Merging
      if (newRec.type === other.type && this.computeSimilarity(newRec.recommendedAction, other.recommendedAction) > 0.75) {
        const merged: EnhancedRecommendation = {
          ...newRec,
          id: `REC-MRG-${Math.floor(Math.random() * 100000)}`,
          title: `Merged: ${newRec.title}`,
          recommendedAction: `${newRec.recommendedAction} & ${other.recommendedAction}`,
          explanation: {
            ...newRec.explanation,
            supportingEvidence: Array.from(new Set([...newRec.explanation.supportingEvidence, ...other.explanation.supportingEvidence])),
            knowledgeSourcesUsed: Array.from(new Set([...newRec.explanation.knowledgeSourcesUsed, ...other.explanation.knowledgeSourcesUsed])),
            affectedAreas: Array.from(new Set([...newRec.explanation.affectedAreas, ...other.explanation.affectedAreas])),
          },
          supersedes: other.id
        };
        supersededIds.push(other.id);
        return { supersededIds, shouldInsert: true, mergedRecommendation: merged };
      }
    }

    return { supersededIds, shouldInsert: true };
  }

  private extractResources(text: string): string[] {
    const resources: string[] = [];
    const regex = /(medical|volunteer|security)\s*(team|group|unit)?\s*([a-zA-Z0-9_-]+|[1-9])/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      resources.push(match[0].toLowerCase().trim());
    }
    return resources;
  }

  private haveOverlappingAreas(a: EnhancedRecommendation, b: EnhancedRecommendation): boolean {
    const areasA = a.explanation.affectedAreas || [];
    const areasB = b.explanation.affectedAreas || [];
    return areasA.some(area => areasB.some(other => other.toLowerCase() === area.toLowerCase()));
  }

  private computeSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.toLowerCase().split(/\s+/));
    const words2 = new Set(s2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private mapEventToPrompt(event: AppEvent, context: AIRequestContext): { promptId: string; parameters: Record<string, any> } | null {
    switch (event.type) {
      case EventType.CrowdDensityChanged: {
        const payload = event.payload as any;
        return {
          promptId: "crowd-congestion-redistribution",
          parameters: {
            gateId: payload.zoneId || "Gate-A",
            zoneDensity: ((payload.densityPercentage || 50) / 100).toString(),
            averageWaitTime: 25,
            flowRate: 15,
            adjacentGates: "Gate-B (nominal, wait 4 mins), Gate-C (steady, wait 6 mins)"
          }
        };
      }
      case EventType.GateQueueUpdated: {
        const payload = event.payload as any;
        return {
          promptId: "crowd-congestion-redistribution",
          parameters: {
            gateId: payload.gateId || "Gate-A",
            zoneDensity: "0.80",
            averageWaitTime: payload.waitTimeMinutes || 20,
            flowRate: payload.currentFlowRate || 10,
            adjacentGates: "Gate-B (nominal, wait 5 mins), Gate-C (steady, wait 7 mins)"
          }
        };
      }
      case EventType.WeatherUpdated: {
        const payload = event.payload as any;
        return {
          promptId: "weather-hazard-response",
          parameters: {
            severity: "HIGH",
            temperature: payload.weather?.temperature || 26,
            condition: payload.weather?.condition || "Clear",
            windSpeed: payload.weather?.windSpeed || 15,
            humidity: payload.weather?.humidity || 55,
            advisory: payload.weather?.advisory || "Normal clear sky."
          }
        };
      }
      case EventType.TransportUpdated: {
        const payload = event.payload as any;
        return {
          promptId: "transportation-disruption-routing",
          parameters: {
            lineId: payload.transportLine?.id || "Metro-Line-2",
            status: payload.transportLine?.status || "DELAYED",
            delayMinutes: payload.transportLine?.delayMinutes || 15,
            affectedPassengers: 4500,
            alternativeOptions: "Shuttle buses operating from south depot, taxi stands."
          }
        };
      }
      case EventType.IncidentCreated: {
        const payload = event.payload as any;
        const incident = payload.incident;
        const category = incident.category;

        if (category === "CROWD" || category === "CROWD_MANAGEMENT") {
          return {
            promptId: "crowd-congestion-redistribution",
            parameters: {
              gateId: "Gate-A",
              zoneDensity: "0.85",
              averageWaitTime: 30,
              flowRate: 12,
              adjacentGates: "Gate-B (wait 6m), Gate-C (wait 5m)"
            }
          };
        } else if (category === "SECURITY") {
          return {
            promptId: "security-threat-assessment",
            parameters: {
              location: incident.location || "Sector East concourse",
              severity: incident.severity || "HIGH",
              threatDetails: incident.description || "Unidentified crowd gather event near east ticket counters."
            }
          };
        } else if (category === "MEDICAL") {
          return {
            promptId: "medical-incident-dispatch",
            parameters: {
              location: incident.location || "Concourse Sector C",
              severity: incident.severity || "HIGH",
              symptoms: incident.description || "Heat related distress.",
              availableTeams: "Medical Team 1 (Sector A), Medical Team 2 (Sector C)"
            }
          };
        } else if (category === "VOLUNTEER") {
          return {
            promptId: "volunteer-reassignment",
            parameters: {
              sourceZone: incident.location || "Sector East",
              targetZone: "Sector West",
              quantity: 8,
              role: "Steward",
              priority: incident.severity || "MEDIUM"
            }
          };
        } else if (category === "WEATHER") {
          return {
            promptId: "weather-hazard-response",
            parameters: {
              severity: incident.severity || "HIGH",
              condition: "Rainy",
              temperature: 20,
              windSpeed: 28,
              humidity: 92,
              advisory: incident.description || "Heavy storm cells approaching."
            }
          };
        } else {
          return {
            promptId: "match-operational-phases",
            parameters: {
              currentPhase: "Ingress",
              timeToKickoff: 40,
              attendanceRate: 80,
              activeIncidents: incident.title || "Nominal"
            }
          };
        }
      }
      default:
        return null;
    }
  }

  private mapPromptToRecType(promptId: string): RecommendationType {
    switch (promptId) {
      case "crowd-congestion-redistribution": return RecommendationType.CROWD;
      case "security-threat-assessment": return RecommendationType.SECURITY;
      case "medical-incident-dispatch": return RecommendationType.MEDICAL;
      case "volunteer-reassignment": return RecommendationType.VOLUNTEER;
      case "transportation-disruption-routing": return RecommendationType.TRANSPORT;
      case "accessibility-routing-optimization": return RecommendationType.ACCESSIBILITY;
      case "sustainability-waste-water-optimization": return RecommendationType.SUSTAINABILITY;
      case "weather-hazard-response": return RecommendationType.WEATHER;
      case "match-operational-phases": return RecommendationType.MATCH_OPERATIONS;
      default: return RecommendationType.MATCH_OPERATIONS;
    }
  }

  private isApiKeyConfigured(): boolean {
    if (typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY) {
      return true;
    }
    if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
      return true;
    }
    return false;
  }

  private getRequiredRecommendation(id: string): EnhancedRecommendation {
    const rec = this.recommendations.find(r => r.id === id);
    if (!rec) {
      throw new Error(`Recommendation not found for ID: ${id}`);
    }
    return rec;
  }

  private updateLocalRecommendation(rec: EnhancedRecommendation) {
    const idx = this.recommendations.findIndex(r => r.id === rec.id);
    if (idx !== -1) {
      this.recommendations[idx] = { ...rec };
    }
  }

  private updateSuccessMetrics(action: string, rec: EnhancedRecommendation) {
    this.metrics.totalGenerated = this.recommendations.length;
    this.metrics.totalApproved = this.recommendations.filter(r => r.lifecycleStatus === RecommendationStatus.APPROVED || r.lifecycleStatus === RecommendationStatus.EXECUTED).length;
    this.metrics.totalRejected = this.recommendations.filter(r => r.lifecycleStatus === RecommendationStatus.REJECTED).length;
    this.metrics.totalExecuted = this.recommendations.filter(r => r.lifecycleStatus === RecommendationStatus.EXECUTED).length;

    const reviewed = this.recommendations.filter(r => r.lifecycleStatus !== RecommendationStatus.PENDING_REVIEW && r.lifecycleStatus !== RecommendationStatus.DRAFT);
    if (reviewed.length > 0) {
      this.metrics.acceptanceRate = parseFloat((this.metrics.totalApproved / reviewed.length).toFixed(2));
    }

    if (action === "execute" && rec.resolvedAt) {
      const execTime = (new Date(rec.resolvedAt).getTime() - new Date(rec.createdAt).getTime()) / (1000 * 60);
      const count = this.metrics.totalExecuted;
      const currentAvg = this.metrics.averageExecutionTimeMinutes;
      this.metrics.averageExecutionTimeMinutes = parseFloat(((currentAvg * (count - 1) + execTime) / count).toFixed(1));
    }

    if (action === "feedback" && rec.feedbackScore !== undefined) {
      const accuracy = rec.feedbackScore / 5;
      const ratedRecs = this.recommendations.filter(r => r.feedbackScore !== undefined);
      const count = ratedRecs.length;
      const currentAccuracy = this.metrics.recommendationAccuracy;
      this.metrics.recommendationAccuracy = parseFloat(((currentAccuracy * (count - 1) + accuracy) / count).toFixed(2));
    }

    this.metrics.averageConfidence = parseFloat((this.recommendations.reduce((acc, r) => acc + r.confidenceScore, 0) / this.recommendations.length).toFixed(2)) || 0;
    this.metrics.averageOperationalImpact = parseFloat((this.recommendations.reduce((acc, r) => acc + r.ranking.operationalImpact, 0) / this.recommendations.length).toFixed(1)) || 0;
  }
}
