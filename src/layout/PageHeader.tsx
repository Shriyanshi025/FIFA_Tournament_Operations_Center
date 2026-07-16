/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { cn } from "@/src/utils/classnames";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Primary page title
   */
  title: string;
  /**
   * Optional support description
   */
  description?: string;
  /**
   * Additional controls (e.g. Action buttons, refresh icons) rendered on the side
   */
  actions?: React.ReactNode;
  /**
   * Places an optional slot above the main title (e.g., Breadcrumbs or back buttons)
   */
  beforeTitle?: React.ReactNode;
}

/**
 * Standardized PageHeader component for consistent layout headers.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  className,
  title,
  description,
  actions,
  beforeTitle,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2xs pb-md mb-md border-b border-border/60 transition-colors duration-normal ease-smooth",
        className
      )}
      {...props}
    >
      {beforeTitle && <div className="w-full mb-1xs" id="page-header-before-slot">{beforeTitle}</div>}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md" id="page-header-main-row">
        <div className="space-y-1.5" id="page-header-text-container">
          <h1 className="font-display font-semibold text-h1 tracking-tight text-text-primary" id="page-header-title">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary leading-relaxed" id="page-header-description">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-xs shrink-0" id="page-header-actions-container">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
