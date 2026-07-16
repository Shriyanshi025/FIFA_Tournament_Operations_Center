/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AIErrorCode {
  ProviderUnavailable = "ProviderUnavailable",
  PromptValidationFailed = "PromptValidationFailed",
  SchemaValidationFailed = "SchemaValidationFailed",
  LowConfidence = "LowConfidence",
  Timeout = "Timeout",
  RateLimited = "RateLimited",
  UnsafeRecommendation = "UnsafeRecommendation",
  ContextMissing = "ContextMissing"
}

export class AIRuntimeError extends Error {
  public code: AIErrorCode;
  public details?: any;
  public timestamp: string;

  constructor(code: AIErrorCode, message: string, details?: any) {
    super(`[AIRuntimeError] [${code}] ${message}`);
    this.name = "AIRuntimeError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AIRuntimeError.prototype);
  }
}
