import React from 'react';
import { performanceMonitor } from '../utils/performance.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    const { errorId } = this.state;
    const { context = 'unknown', tags = {} } = this.props;

    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Record error metrics
    performanceMonitor.recordMetric('error-boundary-triggered', 1, {
      context,
      errorBoundary: this.props.name || 'unnamed',
      ...tags,
    });

    // Enhanced error logging with context
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      tags,
    };

    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setTag('errorBoundary', this.props.name || 'unnamed');
        scope.setTag('context', context);
        scope.setLevel('error');
        Object.keys(tags).forEach((key) => {
          scope.setTag(key, tags[key]);
        });
        scope.setExtra('errorDetails', errorDetails);
        window.Sentry.captureException(error);
      });
    }

    // Log to console with enhanced formatting
    console.group(`🚨 Error Boundary: ${context}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorDetails);
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    performanceMonitor.recordMetric('error-boundary-retry', 1, {
      context: this.props.context,
      retryCount: newRetryCount,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount,
    });
  };

  handleReload = () => {
    performanceMonitor.recordMetric('error-boundary-reload', 1, {
      context: this.props.context,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, context = 'unknown' } = this.props;
      const { error, errorId, retryCount } = this.state;

      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorId={errorId}
            retryCount={retryCount}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            context={context}
          />
        );
      }

      // Default error UI
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              {this.props.userMessage ||
                'An unexpected error occurred while loading this section.'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary__stack">
                  {error && error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary__actions">
              {retryCount < 3 && (
                <button
                  className="error-boundary__retry-btn neon-button"
                  onClick={this.handleRetry}
                  type="button"
                >
                  Try Again ({3 - retryCount} attempts left)
                </button>
              )}

              <button
                className="error-boundary__reload-btn neon-button--secondary"
                onClick={this.handleReload}
                type="button"
              >
                Reload Page
              </button>
            </div>

            {errorId && (
              <p className="error-boundary__id">
                Error ID: <code>{errorId}</code>
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to report errors
export function useErrorHandler() {
  return (error, errorInfo = {}) => {
    const { context = 'hook-error', tags = {} } = errorInfo;

    performanceMonitor.recordMetric('manual-error-reported', 1, {
      context,
      ...tags,
    });

    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { context, ...tags },
        extra: errorInfo,
      });
    }

    console.error(`Manual Error [${context}]:`, error, errorInfo);
  };
}

// HOC for adding error boundary to class components
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  const WithErrorBoundaryComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundaryComponent;
}

export default ErrorBoundary;
