"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Context label used in error messaging, e.g. "Knowledge Vault" */
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("[KnowledgeOS]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const context = this.props.context || "this section";

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-data-negative/30 bg-data-negative/5 p-8 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-data-negative/40 bg-data-negative/10">
            <AlertTriangle className="h-6 w-6 text-data-negative" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-heading-sm text-text-primary">
              {context} couldn&apos;t load
            </h2>
            <p className="text-body-sm text-text-secondary max-w-xs">
              Something went wrong while rendering {context}. Your data is safe
              — refresh the section to try again.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-4 py-2 text-body-sm font-medium text-text-primary hover:border-accent-signal/50 hover:text-accent-signal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-2 max-w-full overflow-auto rounded bg-bg-surface p-3 text-left text-[10px] text-data-negative font-mono">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
