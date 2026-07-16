/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Sizing option for the loader
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Style color accent of the spinner
   * @default 'current'
   */
  color?: "current" | "primary" | "secondary" | "success" | "warning" | "error";
}

/**
 * Standard SVG-based high performance loading spinner.
 * Integrates directly with theme CSS custom properties.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", color = "current", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-md h-md",
      md: "w-xl h-xl",
      lg: "w-2xl h-2xl",
    };

    const colorClasses = {
      current: "text-current",
      primary: "text-primary",
      secondary: "text-secondary",
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
    };

    return (
      <span
        ref={ref}
        role="status"
        aria-label="loading"
        className={cn("inline-block animate-spin", sizeClasses[size], colorClasses[color], className)}
        {...props}
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>
    );
  }
);

Spinner.displayName = "Spinner";
