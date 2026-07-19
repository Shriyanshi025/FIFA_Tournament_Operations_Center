/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { telemetry } from "../../services/observability";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    telemetry.log("ERROR", `Uncaught React UI Component Error: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    telemetry.reportComponentStatus("WorkflowEngine", "FAILING", 0, error.message);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error || new Error("Unknown error"), this.reset);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="p-md bg-surface border border-error/40 rounded-md text-error space-y-sm my-xs"
        >
          <h3 className="font-bold text-body">Component Error Encountered</h3>
          <p className="text-caption font-mono">
            {this.state.error?.message || "An unexpected UI error occurred."}
          </p>
          <button
            onClick={this.reset}
            className="px-sm py-xs bg-error text-white text-caption rounded cursor-pointer font-bold"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
