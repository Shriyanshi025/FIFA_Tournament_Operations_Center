/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  service: string;
  level: LogLevel;
  timestamp: string;
  details?: Record<string, any>;
  error?: Error;
}

/**
 * Centered logging utility supporting levels, traceback info, and audit-level formatting.
 */
class Logger {
  private formatLog(level: LogLevel, service: string, message: string, details?: Record<string, any>, error?: Error): LogPayload {
    return {
      message,
      service,
      level,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(error && { error }),
    };
  }

  public info(service: string, message: string, details?: Record<string, any>): void {
    const payload = this.formatLog("info", service, message, details);
    console.info(`[INFO][${payload.service}] ${payload.message}`, payload.details || "");
  }

  public warn(service: string, message: string, details?: Record<string, any>): void {
    const payload = this.formatLog("warn", service, message, details);
    console.warn(`[WARN][${payload.service}] ${payload.message}`, payload.details || "");
  }

  public error(service: string, message: string, error?: Error, details?: Record<string, any>): void {
    const payload = this.formatLog("error", service, message, details, error);
    console.error(`[ERROR][${payload.service}] ${payload.message}`, payload.error || "", payload.details || "");
  }
}

export const logger = new Logger();
export type { LogPayload };
