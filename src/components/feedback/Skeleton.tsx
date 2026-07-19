/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
  height?: string | number;
  width?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rect",
  height,
  width,
}) => {
  const styles: React.CSSProperties = {
    height: height !== undefined ? height : undefined,
    width: width !== undefined ? width : undefined,
  };

  let variantClass = "rounded-xs";
  if (variant === "text") variantClass = "rounded-xs h-3 w-5/6";
  if (variant === "circle") variantClass = "rounded-full";

  return (
    <div
      className={`bg-border/60 animate-pulse ${variantClass} ${className}`}
      style={styles}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="border p-md bg-surface rounded-md space-y-sm shadow-low w-full">
      <Skeleton variant="text" width="40%" className="mb-2xs" />
      <Skeleton variant="rect" height={40} className="w-full" />
      <Skeleton variant="text" width="85%" className="mt-2xs" />
    </div>
  );
};
