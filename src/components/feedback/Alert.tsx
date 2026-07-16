/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle 
} from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The severity of the alert banner
   * @default 'info'
   */
  variant?: "info" | "success" | "warning" | "error";
  /**
   * Optional custom title. If omitted, only the description/children are shown.
   */
  title?: string;
  /**
   * Whether to display the standard icon associated with the alert variant.
   * @default true
   */
  showIcon?: boolean;
}

/**
 * Reusable Alert banner for mission critical alerts and announcements.
 * Styled for high readability with low eye strain, compliant with WCAG contrast.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, showIcon = true, children, ...props }, ref) => {
    
    // Choose the appropriate ARIA role: error and warnings are high priority alerts
    const ariaRole = variant === "error" || variant === "warning" ? "alert" : "status";

    const variantStyles = {
      info: "bg-primary/5 border-primary/40 text-text-primary",
      success: "bg-secondary/5 border-secondary/40 text-text-primary",
      warning: "bg-warning/5 border-warning/40 text-text-primary",
      error: "bg-error/5 border-error/40 text-text-primary",
    };

    const iconColors = {
      info: "text-primary",
      success: "text-secondary",
      warning: "text-warning",
      error: "text-error",
    };

    const getIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle className={cn("w-lg h-lg shrink-0", iconColors[variant])} aria-hidden="true" />;
        case "warning":
          return <AlertTriangle className={cn("w-lg h-lg shrink-0", iconColors[variant])} aria-hidden="true" />;
        case "error":
          return <XCircle className={cn("w-lg h-lg shrink-0", iconColors[variant])} aria-hidden="true" />;
        case "info":
        default:
          return <Info className={cn("w-lg h-lg shrink-0", iconColors[variant])} aria-hidden="true" />;
      }
    };

    return (
      <div
        ref={ref}
        role={ariaRole}
        className={cn(
          "flex items-start gap-md border rounded-md p-lg bg-surface transition-all duration-normal ease-smooth",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {showIcon && getIcon()}
        <div className="flex-1 space-y-2xs" id="alert-content-wrapper">
          {title && (
            <h5 className="font-display font-semibold text-body-base leading-tight text-text-primary" id="alert-title">
              {title}
            </h5>
          )}
          <div className="text-body-base text-text-secondary leading-relaxed" id="alert-body">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";
