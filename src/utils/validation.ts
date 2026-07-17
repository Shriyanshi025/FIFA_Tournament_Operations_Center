/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Validates whether a PIN string is exactly 4 numerical digits
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Validates if an input is a valid non-empty string
 */
export function validateNonEmptyString(val: unknown): boolean {
  return typeof val === "string" && val.trim().length > 0;
}
