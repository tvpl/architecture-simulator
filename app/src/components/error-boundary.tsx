"use client";
/**
 * ErrorBoundary — catches render errors in child components.
 * Wrap the FlowCanvas so a broken node/edge render doesn't crash the whole app.
 */
import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <CanvasFallback error={this.state.error} onReset={this.handleReset} />
        )
      );
    }
    return this.props.children;
  }
}

function CanvasFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-background">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Ocorreu um erro inesperado no canvas
        </p>
        {error?.message && (
          <p className="text-xs text-muted-foreground font-mono max-w-sm truncate">
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={onReset}
        className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
      >
        Tentar novamente
      </button>
    </div>
  );
}
