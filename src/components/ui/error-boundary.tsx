"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="font-semibold text-sm">Something went wrong</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Convenience wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
