/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * The text label displayed above the input element.
   */
  label?: string;
  /**
   * Explanatory helper text displayed below the input.
   */
  helperText?: string;
  /**
   * Error message text. When specified, borders style to crimson and helper text is overridden.
   */
  error?: string;
}

/**
 * Reusable Form Input primitive.
 * Designed with a high contrast focus-visible ring, disabled states, and full screen-reader label binding.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, type = "text", disabled, ...props }, ref) => {
    // Generate a unique fallback ID if none was supplied to ensure label/helper text HTML binding
    const fallbackId = React.useId();
    const inputId = id || fallbackId;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const hasError = !!error;

    return (
      <div className="w-full flex flex-col gap-2xs text-left" id={`${inputId}-group-container`}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider"
            id={`${inputId}-label`}
          >
            {label}
          </label>
        )}
        
        <div className="relative flex items-center" id={`${inputId}-field-wrapper`}>
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperTextId : undefined
            }
            className={cn(
              "w-full bg-background border rounded-xs px-sm py-xs text-body-base text-text-primary placeholder:text-text-muted transition-all duration-fast " +
              "focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:ring-0 " +
              "disabled:bg-disabled-bg disabled:text-disabled-text disabled:border-border disabled:cursor-not-allowed",
              hasError
                ? "border-error focus-visible:outline-error"
                : "border-border hover:border-text-secondary focus-visible:outline-focus",
              className
            )}
            {...props}
          />
        </div>

        {hasError ? (
          <span
            id={errorId}
            role="alert"
            className="text-caption font-semibold text-error flex items-center gap-2xs animate-fade-in-slide"
          >
            <span aria-hidden="true" className="font-sans">▲</span> {error}
          </span>
        ) : helperText ? (
          <span
            id={helperTextId}
            className="text-[11px] text-text-muted leading-normal"
          >
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
