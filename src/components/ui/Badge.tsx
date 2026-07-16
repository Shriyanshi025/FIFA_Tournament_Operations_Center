/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The semantic status or classification level
   * @default 'neutral'
   */
  variant?: "critical" | "warning" | "success" | "info" | "neutral";
  /**
   * The sizing option for the badge
   * @default 'md'
   */
  size?: "sm" | "md";
  /**
   * Displays an auxiliary geometric shape symbol for colorblind accessibility.
   * Circle for success/nominal, Diamond for warning, Triangle for critical, Square for info.
   * @default false
   */
  showShapeSymbol?: boolean;
}

/**
 * Reusable Badge component for categorizing alerts, severities, and states.
 * Fully optimized for accessibility, rendering high-contrast borders and geometric shape cues.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "md", showShapeSymbol = false, children, ...props }, ref) => {
    
    const baseClasses = 
      "inline-flex items-center justify-center rounded-full font-sans font-medium tracking-normal border select-none transition-all duration-fast";

    const variantClasses = {
      critical: "bg-error/10 border-error/25 text-error",
      warning: "bg-warning/10 border-warning/25 text-warning-fg dark:text-warning", // light theme warning has dark foreground for contrast, dark theme warning stays amber
      success: "bg-secondary/10 border-secondary/25 text-secondary",
      info: "bg-primary/10 border-primary/25 text-primary",
      neutral: "bg-neutral/10 border-border text-text-secondary",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-[10px] gap-1xs",
      md: "px-2.5 py-0.5 text-xs gap-xs",
    };

    // Accessibility geometric shapes (allows color-blind operators to identify statuses immediately)
    const getShapeSymbol = () => {
      switch (variant) {
        case "critical":
          return "▲"; // Triangle (Warning / Critical Danger)
        case "warning":
          return "◆"; // Diamond (Caution Alert)
        case "success":
          return "●"; // Circle (Nominal Safe State)
        case "info":
          return "■"; // Square (Information Channel)
        default:
          return "•"; // Dot / Bullet
      }
    };

    return (
      <span
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {showShapeSymbol && (
          <span 
            className="font-sans shrink-0" 
            aria-hidden="true"
          >
            {getShapeSymbol()}
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
