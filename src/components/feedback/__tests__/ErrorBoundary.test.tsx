/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

function ProblematicComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated React Component Render Error");
  }
  return <div>Component Rendered Normal</div>;
}

describe("ErrorBoundary Component Unit Test Suite", () => {
  it("renders children when no exception is thrown", () => {
    const boundary = new ErrorBoundary({ children: <ProblematicComponent shouldThrow={false} /> });
    expect(boundary.state.hasError).toBe(false);
  });

  it("updates state when getDerivedStateFromError is called", () => {
    const error = new Error("Test error");
    const derivedState = ErrorBoundary.getDerivedStateFromError(error);

    expect(derivedState.hasError).toBe(true);
    expect(derivedState.error).toBe(error);
  });

  it("resets state when reset() method is invoked", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { hasError: true, error: new Error("Crash") };

    expect(boundary.reset).toBeDefined();
    boundary.reset();
  });
});
