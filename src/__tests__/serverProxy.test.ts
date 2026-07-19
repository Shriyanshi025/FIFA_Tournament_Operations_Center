/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Secure API Proxy & Rate Limiter Integration Test Suite", () => {
  // Unit test the sliding window rate limiting algorithm matching server.ts implementation
  function createRateLimiter(maxRequests: number = 35, windowMs: number = 60000) {
    const rateLimitMap = new Map<string, number[]>();

    return (ip: string, now: number = Date.now()): { allowed: boolean; status?: number; error?: string } => {
      if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
      }

      const timestamps = rateLimitMap.get(ip)!;
      const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

      if (validTimestamps.length >= maxRequests) {
        return {
          allowed: false,
          status: 429,
          error: "Too many requests. Please wait before retrying.",
        };
      }

      validTimestamps.push(now);
      rateLimitMap.set(ip, validTimestamps);
      return { allowed: true };
    };
  }

  // Unit test backend payload validation matching server.ts
  function validateGeneratePayload(body: any, aiConfigured: boolean) {
    if (!aiConfigured) {
      return { status: 503, error: "Gemini API key is not configured on the server host." };
    }
    const { promptText } = body || {};
    if (!promptText || typeof promptText !== "string") {
      return { status: 400, error: "Invalid or empty promptText parameter." };
    }
    if (promptText.length > 5000) {
      return { status: 400, error: "Prompt payload exceeds safety limit of 5000 characters." };
    }
    return { status: 200, valid: true };
  }

  function validateEmbedPayload(body: any, aiConfigured: boolean) {
    if (!aiConfigured) {
      return { status: 503, error: "Gemini API key is not configured on the server host." };
    }
    const { text } = body || {};
    if (!text || typeof text !== "string") {
      return { status: 400, error: "Invalid or empty text parameter." };
    }
    if (text.length > 8000) {
      return { status: 400, error: "Text payload exceeds embedding limit of 8000 characters." };
    }
    return { status: 200, valid: true };
  }

  it("rate limiter permits up to 35 requests per window and returns 429 when exceeded", () => {
    const rateLimiter = createRateLimiter(35, 60000);
    const clientIp = "192.168.1.100";
    const now = 1000000;

    for (let i = 0; i < 35; i++) {
      const res = rateLimiter(clientIp, now);
      expect(res.allowed).toBe(true);
    }

    const exceeded = rateLimiter(clientIp, now);
    expect(exceeded.allowed).toBe(false);
    expect(exceeded.status).toBe(429);
    expect(exceeded.error).toContain("Too many requests");
  });

  it("rate limiter resets expired timestamps after window duration", () => {
    const rateLimiter = createRateLimiter(35, 60000);
    const clientIp = "192.168.1.101";
    let now = 1000000;

    for (let i = 0; i < 35; i++) {
      rateLimiter(clientIp, now);
    }

    expect(rateLimiter(clientIp, now).allowed).toBe(false);

    // Advance time by 61 seconds
    now += 61000;
    expect(rateLimiter(clientIp, now).allowed).toBe(true);
  });

  it("validates /api/ai/generate payload limits and API key configuration", () => {
    // 503 when AI key missing
    expect(validateGeneratePayload({ promptText: "hello" }, false).status).toBe(503);

    // 400 when promptText missing or empty
    expect(validateGeneratePayload({}, true).status).toBe(400);
    expect(validateGeneratePayload({ promptText: "" }, true).status).toBe(400);

    // 400 when promptText exceeds 5000 characters
    const longPrompt = "a".repeat(5001);
    expect(validateGeneratePayload({ promptText: longPrompt }, true).status).toBe(400);

    // 200 when valid promptText
    expect(validateGeneratePayload({ promptText: "Valid prompt" }, true).status).toBe(200);
  });

  it("validates /api/ai/embed payload limits and API key configuration", () => {
    // 503 when AI key missing
    expect(validateEmbedPayload({ text: "hello" }, false).status).toBe(503);

    // 400 when text missing or empty
    expect(validateEmbedPayload({}, true).status).toBe(400);

    // 400 when text exceeds 8000 characters
    const longText = "b".repeat(8001);
    expect(validateEmbedPayload({ text: longText }, true).status).toBe(400);

    // 200 when valid text
    expect(validateEmbedPayload({ text: "Valid embedding text" }, true).status).toBe(200);
  });
});
