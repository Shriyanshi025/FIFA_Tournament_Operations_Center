/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, enables hover interactive highlights and elevates shadow on mouse-over.
   * @default false
   */
  isInteractive?: boolean;
  /**
   * Controls visual elevation shadow level.
   * @default 'medium'
   */
  shadow?: "none" | "low" | "medium" | "high";
}

/**
 * Base Card component.
 * Serves as the structured background for high-density command center dashboards.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isInteractive = false, shadow = "medium", ...props }, ref) => {
    const shadowClasses = {
      none: "shadow-none",
      low: "shadow-low",
      medium: "shadow-medium",
      high: "shadow-high",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface border border-border rounded-md overflow-hidden text-text-primary transition-all duration-normal ease-smooth",
          shadowClasses[shadow],
          isInteractive && "hover:bg-surface-hover hover:border-text-secondary cursor-pointer hover:-translate-y-[1px]",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2xs p-lg border-b border-border/50", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display font-semibold text-h3 tracking-tight text-text-primary", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-caption text-text-secondary leading-normal", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-lg text-body-base leading-relaxed", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-lg border-t border-border/50 bg-background/20", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
