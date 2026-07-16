/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnowledgeAsset, KnowledgeCategory, KnowledgeStatus, KnowledgePriority } from "./types";

export interface KnowledgeValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a Knowledge Asset against core schema, structural types, and metadata constraints.
 */
export function validateKnowledgeAsset(asset: Partial<KnowledgeAsset>): KnowledgeValidationResult {
  const errors: string[] = [];

  // 1. Mandatory ID checks
  if (!asset.id || typeof asset.id !== "string" || asset.id.trim() === "") {
    errors.push("Asset ID is required and must be a non-empty string.");
  } else if (!/^[a-z0-9-_]+$/i.test(asset.id)) {
    errors.push("Asset ID must only contain alphanumeric characters, hyphens, or underscores.");
  }

  // 2. Title validation
  if (!asset.title || typeof asset.title !== "string" || asset.title.trim() === "") {
    errors.push("Asset Title is required.");
  } else if (asset.title.length < 5) {
    errors.push("Asset Title must be at least 5 characters long for clear operational indexing.");
  }

  // 3. Content validation
  if (!asset.content || typeof asset.content !== "string" || asset.content.trim() === "") {
    errors.push("Asset Content is required.");
  } else if (asset.content.length < 20) {
    errors.push("Asset Content is too short. It must contain at least 20 characters of detailed SOP documentation.");
  }

  // 4. Category check
  if (!asset.category) {
    errors.push("Asset Category is required.");
  } else if (!Object.values(KnowledgeCategory).includes(asset.category as KnowledgeCategory)) {
    errors.push(`Invalid Category: '${asset.category}'. Must be one of the pre-approved tournament domains.`);
  }

  // 5. Authority check
  if (!asset.authority || typeof asset.authority !== "string" || asset.authority.trim() === "") {
    errors.push("Asset Authority is required (e.g., 'FIFA TOC Security').");
  }

  // 6. Language check
  if (!asset.language || typeof asset.language !== "string" || asset.language.trim() === "") {
    errors.push("Asset Language is required.");
  } else if (asset.language.length !== 2) {
    errors.push("Asset Language must be a 2-letter ISO 639-1 language code (e.g., 'en', 'es', 'fr').");
  }

  // 7. Versioning format check
  if (!asset.version || typeof asset.version !== "string" || asset.version.trim() === "") {
    errors.push("Asset Version is required.");
  } else if (!/^\d+(\.\d+){1,2}$/.test(asset.version)) {
    errors.push("Asset Version must follow a standard semantic format (e.g. '1.0' or '2.1.3').");
  }

  // 8. Date validation
  if (!asset.lastUpdated) {
    errors.push("Asset Last Updated timestamp is required.");
  } else {
    const timestamp = Date.parse(asset.lastUpdated);
    if (isNaN(timestamp)) {
      errors.push("Asset Last Updated must be a valid ISO 8601 datetime string.");
    }
  }

  // 9. Priority verification
  if (asset.priority === undefined || asset.priority === null) {
    errors.push("Asset Priority is required.");
  } else if (!Object.values(KnowledgePriority).includes(asset.priority as number)) {
    errors.push("Asset Priority must be a valid numerical enum: LOW(1), MEDIUM(2), HIGH(3), or CRITICAL(4).");
  }

  // 10. Status validation
  if (!asset.validityStatus) {
    errors.push("Asset Validity Status is required.");
  } else if (!Object.values(KnowledgeStatus).includes(asset.validityStatus as KnowledgeStatus)) {
    errors.push(`Invalid Validity Status: '${asset.validityStatus}'. Must be one of Draft, Published, Deprecated, Archived.`);
  }

  // 11. Metadata Array checking
  if (!Array.isArray(asset.applicableVenueTypes) || asset.applicableVenueTypes.length === 0) {
    errors.push("Asset must specify at least one applicable venue type (or 'ALL').");
  }

  if (!Array.isArray(asset.applicableMatchTypes) || asset.applicableMatchTypes.length === 0) {
    errors.push("Asset must specify at least one applicable match type (or 'ALL').");
  }

  if (!Array.isArray(asset.tags)) {
    errors.push("Asset tags must be configured as an array of strings.");
  }

  if (!Array.isArray(asset.auditHistory) || asset.auditHistory.length === 0) {
    errors.push("Asset must contain at least one audit trail entry representing its creation.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
