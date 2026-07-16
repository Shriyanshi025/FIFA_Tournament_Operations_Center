/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats ISO timestamps into readable local time format (HH:MM:SS)
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "--:--:--";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (e) {
    return "--:--:--";
  }
}

/**
 * Formats an ISO string to a human-readable date and time (e.g., "10 Jul 22:22")
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return `${day} ${month} ${time}`;
  } catch (e) {
    return "Invalid Date";
  }
}
