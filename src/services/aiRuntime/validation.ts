/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIValidationResult } from "./types";
import { AIRuntimeError, AIErrorCode } from "./errors";

export class JSONValidator {
  /**
   * Validates a raw response string against a target JSON Schema.
   * If validation fails, tries to execute repair hooks to salvage the response.
   */
  public static validate<T = any>(
    rawResponse: string,
    schema: {
      required: string[];
      properties: Record<string, { type: string; [key: string]: any }>;
    },
    repairHooksEnabled: boolean = true
  ): AIValidationResult<T> {
    let textToParse = rawResponse.trim();
    let parsed: any = null;
    let errors: string[] = [];
    let repaired = false;

    // 1. Initial Parsing Attempt
    try {
      parsed = JSON.parse(textToParse);
    } catch (parseErr: any) {
      if (repairHooksEnabled) {
        // Try to repair syntax before giving up
        try {
          textToParse = this.repairSyntax(textToParse);
          parsed = JSON.parse(textToParse);
          repaired = true;
        } catch (repairErr) {
          return {
            isValid: false,
            errors: [`Failed to parse JSON even after repair attempt: ${parseErr.message}`]
          };
        }
      } else {
        return {
          isValid: false,
          errors: [`JSON parse syntax error: ${parseErr.message}`]
        };
      }
    }

    // 2. Schema Key Validation
    const missingKeys = schema.required.filter(key => parsed[key] === undefined || parsed[key] === null);
    if (missingKeys.length > 0) {
      if (repairHooksEnabled) {
        // Apply recovery hook: Inject safe defaults for missing required keys
        missingKeys.forEach(key => {
          parsed[key] = this.getDefaultValueForType(schema.properties[key]?.type || "string");
        });
        repaired = true;
      } else {
        errors.push(`Missing required properties: ${missingKeys.join(", ")}`);
      }
    }

    // 3. Simple Type Validation
    Object.entries(schema.properties).forEach(([key, rule]) => {
      if (parsed[key] !== undefined && parsed[key] !== null) {
        const actualType = typeof parsed[key];
        const expectedType = rule.type;
        
        if (expectedType === "array" && !Array.isArray(parsed[key])) {
          if (repairHooksEnabled) {
            parsed[key] = [parsed[key]]; // Repair: Wrap in array
            repaired = true;
          } else {
            errors.push(`Property '${key}' expected array, got '${actualType}'`);
          }
        } else if (expectedType === "number" && actualType !== "number") {
          const numValue = Number(parsed[key]);
          if (repairHooksEnabled && !isNaN(numValue)) {
            parsed[key] = numValue; // Repair: Cast to number
            repaired = true;
          } else {
            errors.push(`Property '${key}' expected number, got '${actualType}'`);
          }
        } else if (expectedType === "string" && actualType !== "string") {
          if (repairHooksEnabled) {
            parsed[key] = String(parsed[key]); // Repair: Convert to string
            repaired = true;
          } else {
            errors.push(`Property '${key}' expected string, got '${actualType}'`);
          }
        }
      }
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: parsed as T,
      repaired
    };
  }

  /**
   * Repair common JSON formatting mistakes (e.g. markdown code block wrapping, trailing commas)
   */
  private static repairSyntax(text: string): string {
    let repaired = text;

    // Remove ```json wrapper or ``` wrapping
    if (repaired.includes("```")) {
      const match = repaired.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        repaired = match[1];
      }
    }

    repaired = repaired.trim();

    // Correct missing opening or closing brace/brackets
    if (repaired.startsWith("{") && !repaired.endsWith("}")) {
      repaired += "}";
    } else if (!repaired.startsWith("{") && repaired.endsWith("}")) {
      repaired = "{" + repaired;
    }

    // Attempt to clear illegal trailing commas inside JSON objects/arrays using simple regexes
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");

    return repaired;
  }

  /**
   * Helper to get standard placeholder values for types.
   */
  private static getDefaultValueForType(type: string): any {
    switch (type) {
      case "string": return "FALLBACK_METRIC";
      case "number": return 0.0;
      case "boolean": return false;
      case "array": return [];
      case "object": return {};
      default: return null;
    }
  }
}
