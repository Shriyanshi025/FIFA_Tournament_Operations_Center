/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domain-specific Knowledge Categories for FIFA Stadium Operations.
 */
export enum KnowledgeCategory {
  FIFA_SOPS = "FIFA SOPs",
  EMERGENCY_PROCEDURES = "Emergency Procedures",
  MEDICAL_PROTOCOLS = "Medical Protocols",
  SECURITY_PROCEDURES = "Security Procedures",
  CROWD_MANAGEMENT = "Crowd Management",
  TRANSPORT_OPERATIONS = "Transport Operations",
  VOLUNTEER_GUIDELINES = "Volunteer Guidelines",
  ACCESSIBILITY_GUIDELINES = "Accessibility Guidelines",
  WEATHER_PROCEDURES = "Weather Procedures",
  SUSTAINABILITY_GUIDELINES = "Sustainability Guidelines",
  VENUE_OPERATIONS = "Venue Operations",
  TECHNOLOGY_OPERATIONS = "Technology Operations"
}

/**
 * Lifecycle status of a knowledge asset.
 */
export enum KnowledgeStatus {
  DRAFT = "Draft",
  PUBLISHED = "Published",
  DEPRECATED = "Deprecated",
  ARCHIVED = "Archived"
}

/**
 * Priority levels for operational routing and ranking.
 */
export enum KnowledgePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * Audit trail entry for tracking version changes of an asset.
 */
export interface KnowledgeAuditEntry {
  version: string;
  timestamp: string;
  actor: string;
  action: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "DEPRECATED" | "ARCHIVED";
  notes?: string;
}

/**
 * Fully parameterized model representing a Knowledge Asset (SOP, protocol, emergency plan).
 */
export interface KnowledgeAsset {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  authority: string; // e.g. "FIFA Tournament Operations Center (TOC)"
  language: string;  // ISO 639-1 code e.g. "en", "es", "fr"
  version: string;   // Semantic version e.g. "1.0", "2.1"
  lastUpdated: string; // ISO 8601 string
  applicableVenueTypes: string[]; // e.g. ["OPEN_AIR", "DOME", "ALL"]
  applicableMatchTypes: string[]; // e.g. ["GROUP_STAGE", "KNOCKOUT", "FINAL", "ALL"]
  tags: string[];
  priority: KnowledgePriority;
  validityStatus: KnowledgeStatus;
  auditHistory: KnowledgeAuditEntry[];
}

/**
 * Search and lookup filter configurations for retrieving knowledge assets.
 */
export interface KnowledgeFilter {
  category?: KnowledgeCategory;
  tags?: string[];
  language?: string;
  version?: string;
  validityStatus?: KnowledgeStatus;
  priorityMin?: KnowledgePriority;
  venueType?: string;
  matchType?: string;
}

/**
 * Embedding Provider interface for modular pluggability (Gemini, Vertex AI, OpenAI, Local).
 */
export interface EmbeddingProvider {
  id: string;
  name: string;
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

/**
 * Interface representing the persistence/repository layer of knowledge assets.
 */
export interface KnowledgeRepository {
  getById(id: string): Promise<KnowledgeAsset | null>;
  save(asset: KnowledgeAsset): Promise<void>;
  delete(id: string): Promise<boolean>;
  search(query: string, filter?: KnowledgeFilter): Promise<KnowledgeAsset[]>;
  getAll(): Promise<KnowledgeAsset[]>;
}

/**
 * Structured input for retrieval query execution.
 */
export interface RetrievalQuery {
  text: string;
  filter?: KnowledgeFilter;
  limit?: number;
  minScore?: number;
  strategy?: "KEYWORD" | "SEMANTIC" | "HYBRID";
}

/**
 * Result structure of retrieved knowledge assets with relevance score.
 */
export interface RetrievedDoc {
  asset: KnowledgeAsset;
  score: number; // Normalised relevance score between 0.0 and 1.0
  strategyUsed: "KEYWORD" | "SEMANTIC" | "HYBRID";
}

/**
 * Packaging structure passed down to prompts and standard context builders.
 */
export interface RAGContext {
  formattedContextText: string;
  retrievedDocs: RetrievedDoc[];
  pipelineDurationMs: number;
  retrievalConfidence: number;
}
