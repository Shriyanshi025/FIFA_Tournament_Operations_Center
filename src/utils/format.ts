/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats confidence scores as percentage string (e.g. 0.94 -> 94%)
 */
export function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Formats large numbers with thousand separators (e.g., 60000 -> "60,000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
