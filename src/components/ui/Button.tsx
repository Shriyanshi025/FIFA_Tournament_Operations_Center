/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";
import { Spinner } from "@/src/components/feedback/Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual aesthetic variant of the button
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
  /**
   * Dimensional sizing of the button
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Displays a loading spinner and disables interaction
   * @default false
   */
  isLoading?: boolean;
}

/**
 * Reusable Button component for user actions.
 * Consumes design tokens, supports keyboard focus rings, and handles active, loading, and disabled states.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base classes for mission control buttons: touch target at least 44px on mobile via responsive padding
    const baseClasses = 
      "inline-flex items-center justify-center font-display font-medium rounded-md transition-all duration-fast cursor-pointer select-none " +
      "focus:outline-none focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 focus-visible:shadow-focus " +
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-disabled-bg disabled:text-disabled-text disabled:border-border";

    // Style mapping matching Obsidian & Alabaster specifications
    const variantClasses = {
      primary: "bg-primary text-primary-fg hover:bg-primary/95 border border-transparent shadow-sm active:scale-[0.98]",
      secondary: "bg-surface border border-border text-text-primary hover:bg-surface-hover hover:border-text-secondary shadow-sm active:scale-[0.98]",
      outline: "bg-transparent border border-border text-text-primary hover:bg-surface hover:border-text-secondary active:scale-[0.98]",
      ghost: "bg-transparent text-text-primary hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]",
      danger: "bg-error text-error-fg hover:bg-error/95 border border-transparent shadow-sm active:scale-[0.98]",
      success: "bg-success text-success-fg hover:bg-success/95 border border-transparent shadow-sm active:scale-[0.98]",
      warning: "bg-warning text-warning-fg hover:bg-warning/95 border border-transparent shadow-sm active:scale-[0.98]",
    };

    const sizeClasses = {
      sm: "px-sm py-1.5 text-xs min-h-[32px] gap-1.5",
      md: "px-md py-2 text-sm min-h-[40px] md:min-h-[42px] gap-2", // Premium touch target size
      lg: "px-lg py-3 text-base min-h-[48px] gap-2.5",
    };

    const isBtnDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isBtnDisabled}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        aria-busy={isLoading ? "true" : undefined}
        aria-disabled={isBtnDisabled ? "true" : undefined}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
