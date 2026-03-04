'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error boundary component to catch errors from child components
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 bg-background">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 max-w-md w-full">
            <div className="flex gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-destructive mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  An unexpected error occurred. Please try again or contact support if the
                  problem persists.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4 text-xs">
                    <summary className="cursor-pointer font-mono text-destructive">
                      Error details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-destructive">
                      {this.state.error?.toString()}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            <Button
              onClick={this.handleReset}
              className="w-full gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback component for use with Suspense
 */
export const ErrorFallback = ({ error, reset }) => (
  <div className="flex flex-col items-center justify-center gap-4 p-4">
    <AlertCircle className="h-8 w-8 text-destructive" />
    <h2 className="text-lg font-semibold">Something went wrong</h2>
    <p className="text-sm text-muted-foreground text-center">{error?.message}</p>
    <Button onClick={reset} variant="outline" className="gap-2">
      <RefreshCw className="h-4 w-4" />
      Try again
    </Button>
  </div>
);

export default ErrorBoundary;
