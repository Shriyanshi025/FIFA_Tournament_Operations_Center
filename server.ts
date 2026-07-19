/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Whitelisted allowed AI models to prevent arbitrary backend injection
const ALLOWED_GENAI_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "text-embedding-004",
]);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 1. Strict Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // 2. Strict JSON Body Size Limit (prevents memory exhaustion DOS)
  app.use(express.json({ limit: "50kb" }));

  // Instantiate GenAI SDK securely on the server
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // 3. Rate Limiting with Automatic Cleanup (prevents memory leak & quota exhaustion)
  const rateLimitMap = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS_PER_WINDOW = 35;

  // Periodically clean up stale rate limit IP entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (valid.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000);

  const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = req.ip || req.socket.remoteAddress || "unknown-ip";
    const ip = String(rawIp).replace(/[^a-fA-F0-9:.]/g, ""); // Sanitize IP format
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const timestamps = rateLimitMap.get(ip)!;
    const validTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      console.warn(`[SECURITY-WARN] Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ error: "Too many requests. Please wait before retrying." });
    }

    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);
    next();
  };

  // Helper function to sanitize prompt strings and strip control characters
  const sanitizePromptInput = (text: string): string => {
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  };

  // AI Content Generation Proxy
  app.post("/api/ai/generate", rateLimiter, async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured on the server host." });
      }

      const { promptText, options } = req.body;
      if (!promptText || typeof promptText !== "string") {
        return res.status(400).json({ error: "Invalid or empty promptText parameter." });
      }

      const cleanPrompt = sanitizePromptInput(promptText);
      if (cleanPrompt.length === 0) {
        return res.status(400).json({ error: "Prompt text contains invalid or empty content." });
      }
      if (cleanPrompt.length > 5000) {
        return res.status(400).json({ error: "Prompt payload exceeds safety limit of 5000 characters." });
      }

      // Validate requested model against whitelist
      const requestedModel = options?.model || "gemini-2.5-flash";
      if (!ALLOWED_GENAI_MODELS.has(requestedModel)) {
        return res.status(400).json({ error: `Requested model '${requestedModel}' is not authorized.` });
      }

      const response = await ai.models.generateContent({
        model: requestedModel,
        contents: cleanPrompt,
        config: {
          temperature: Math.max(0, Math.min(1, Number(options?.temperature ?? 0.2))),
          responseMimeType: options?.responseMimeType || "application/json",
          safetySettings: options?.safetySettings,
        },
      });

      res.json(response);
    } catch (err: any) {
      console.error("[AI-PROXY-ERROR]", err?.message || err);
      res.status(500).json({
        error: process.env.NODE_ENV === "production" ? "Internal AI computation error." : err.message || "Internal AI failure.",
      });
    }
  });

  // AI Embedding Proxy
  app.post("/api/ai/embed", rateLimiter, async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured on the server host." });
      }

      const { text, modelName } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Invalid or empty text parameter." });
      }

      const cleanText = sanitizePromptInput(text);
      if (cleanText.length === 0) {
        return res.status(400).json({ error: "Text contains invalid or empty content." });
      }
      if (cleanText.length > 8000) {
        return res.status(400).json({ error: "Text payload exceeds embedding limit of 8000 characters." });
      }

      const requestedModel = modelName || "text-embedding-004";
      if (!ALLOWED_GENAI_MODELS.has(requestedModel)) {
        return res.status(400).json({ error: `Requested model '${requestedModel}' is not authorized.` });
      }

      const response = await ai.models.embedContent({
        model: requestedModel,
        contents: cleanText,
      });

      res.json(response);
    } catch (err: any) {
      console.error("[AI-EMBED-ERROR]", err?.message || err);
      res.status(500).json({
        error: process.env.NODE_ENV === "production" ? "Internal AI embedding error." : err.message || "Internal AI embedding failure.",
      });
    }
  });

  // API health route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", aiConfigured: !!ai });
  });

  // Vite middleware for development vs Static Serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
