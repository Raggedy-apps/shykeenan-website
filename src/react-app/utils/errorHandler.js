import { performanceMonitor } from './performance.js';

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Error categories
export const ERROR_CATEGORY = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  RENDERING: 'rendering',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  BUSINESS_LOGIC: 'business_logic',
  EXTERNAL_SERVICE: 'external_service',
  UNKNOWN: 'unknown',
};

class GlobalErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    this.setupGlobalErrorListeners();
    this.setupUnhandledRejectionHandler();
    this.startErrorProcessing();

    this.initialized = true;
  }

  setupGlobalErrorListeners() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        severity: ERROR_SEVERITY.HIGH,
        category: ERROR_CATEGORY.RENDERING,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason,
        severity: ERROR_SEVERITY.MEDIUM,
        category: ERROR_CATEGORY.BUSINESS_LOGIC,
      });
    });
  }

  setupUnhandledRejectionHandler() {
    // Additional promise rejection tracking
    if (typeof window !== 'undefined') {
      // Track React error boundaries
      window.addEventListener('react-error', (event) => {
        this.handleError({
          type: 'react_error',
          message: event.detail?.message || 'React error',
          componentStack: event.detail?.componentStack,
          error: event.detail?.error,
          severity: ERROR_SEVERITY.HIGH,
          category: ERROR_CATEGORY.RENDERING,
        });
      });
    }
  }

  startErrorProcessing() {
    // Process error queue periodically
    setInterval(() => {
      this.processErrorQueue();
    }, 5000);

    // Process errors immediately for critical issues
    setInterval(() => {
      this.processCriticalErrors();
    }, 1000);
  }

  handleError(errorData) {
    const enrichedError = this.enrichErrorData(errorData);

    // Add to queue for processing
    this.addToQueue(enrichedError);

    // Immediate processing for critical errors
    if (enrichedError.severity === ERROR_SEVERITY.CRITICAL) {
      this.processErrorImmediately(enrichedError);
    }

    // Record metrics
    performanceMonitor.recordMetric('error-occurred', 1, {
      severity: enrichedError.severity,
      category: enrichedError.category,
      type: enrichedError.type,
    });

    return enrichedError.errorId;
  }

  enrichErrorData(errorData) {
    const errorId = this.generateErrorId();

    return {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: this.getMemoryInfo(),
      localStorageQuota: this.getStorageQuota(),
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId(),
      ...errorData,
    };
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addToQueue(error) {
    this.errorQueue.push(error);

    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  processErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errorsToProcess = [...this.errorQueue];
    this.errorQueue = [];

    errorsToProcess.forEach((error) => {
      this.processError(error);
    });
  }

  processCriticalErrors() {
    const criticalErrors = this.errorQueue.filter(
      (error) => error.severity === ERROR_SEVERITY.CRITICAL
    );

    criticalErrors.forEach((error) => {
      this.processErrorImmediately(error);
    });
  }

  processErrorImmediately(error) {
    // Send to external services immediately
    this.sendToExternalServices(error);

    // Show user notification for critical errors
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      this.showCriticalErrorNotification(error);
    }
  }

  async processError(error) {
    try {
      // Categorize and enhance error
      const categorizedError = this.categorizeError(error);

      // Check if error should trigger retry logic
      if (this.shouldRetry(error)) {
        await this.handleRetry(error);
        return;
      }

      // Send to external error tracking
      this.sendToExternalServices(categorizedError);

      // Store in local error log
      this.storeErrorLocally(categorizedError);

      // Trigger alerts if needed
      this.checkAlertThresholds(categorizedError);
    } catch (processingError) {
      console.error('Error processing error:', processingError);
    }
  }

  categorizeError(error) {
    // Auto-categorize based on error characteristics
    if (
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      return { ...error, category: ERROR_CATEGORY.NETWORK };
    }

    if (error.message?.includes('auth') || error.message?.includes('token')) {
      return { ...error, category: ERROR_CATEGORY.AUTHENTICATION };
    }

    if (
      error.message?.includes('permission') ||
      error.message?.includes('unauthorized')
    ) {
      return { ...error, category: ERROR_CATEGORY.AUTHORIZATION };
    }

    if (
      error.message?.includes('validation') ||
      error.message?.includes('invalid')
    ) {
      return { ...error, category: ERROR_CATEGORY.VALIDATION };
    }

    return error;
  }

  shouldRetry(error) {
    const retryableCategories = [
      ERROR_CATEGORY.NETWORK,
      ERROR_CATEGORY.EXTERNAL_SERVICE,
    ];

    const retryableTypes = ['fetch', 'network', 'timeout'];

    return (
      retryableCategories.includes(error.category) ||
      retryableTypes.some((type) => error.type?.includes(type))
    );
  }

  async handleRetry(error) {
    const errorKey = `${error.category}_${error.type}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.maxRetries) {
      this.retryAttempts.delete(errorKey);
      return;
    }

    this.retryAttempts.set(errorKey, attempts + 1);

    // Exponential backoff
    const delay = Math.pow(2, attempts) * 1000;

    setTimeout(() => {
      this.retryAttempts.delete(errorKey);
      this.triggerRetryCallback(error);
    }, delay);
  }

  triggerRetryCallback(error) {
    // Trigger custom retry logic
    window.dispatchEvent(
      new CustomEvent('error:retry', {
        detail: { error },
      })
    );
  }

  sendToExternalServices(error) {
    // Send to Sentry if available
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setLevel(this.mapSeverityToSentryLevel(error.severity));
        scope.setTag('category', error.category);
        scope.setTag('type', error.type);
        scope.setExtra('errorData', error);
        window.Sentry.captureException(error.error || new Error(error.message));
      });
    }

    // Send to custom logging endpoint
    this.sendToCustomEndpoint(error);
  }

  mapSeverityToSentryLevel(severity) {
    const mapping = {
      [ERROR_SEVERITY.LOW]: 'info',
      [ERROR_SEVERITY.MEDIUM]: 'warning',
      [ERROR_SEVERITY.HIGH]: 'error',
      [ERROR_SEVERITY.CRITICAL]: 'fatal',
    };
    return mapping[severity] || 'error';
  }

  async sendToCustomEndpoint(error) {
    try {
      // In production, send to your logging endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              message: error.message,
              category: error.category,
              severity: error.severity,
              timestamp: error.timestamp,
              url: error.url,
              userAgent: error.userAgent,
            },
          }),
        }).catch(() => {
          // Silently fail - don't create error loops
        });
      }
    } catch {
      // Ignore network errors
    }
  }

  storeErrorLocally(error) {
    try {
      const errors = this.getStoredErrors();
      errors.push(error);

      // Keep only last 50 errors
      const recentErrors = errors.slice(-50);

      localStorage.setItem('app_errors', JSON.stringify(recentErrors));
    } catch {
      // Ignore storage errors
    }
  }

  getStoredErrors() {
    try {
      const stored = localStorage.getItem('app_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  checkAlertThresholds(error) {
    // Check if error rate exceeds thresholds
    const recentErrors = this.getStoredErrors();
    const lastHour = Date.now() - 60 * 60 * 1000;
    const recentErrorCount = recentErrors.filter(
      (e) => new Date(e.timestamp) > lastHour
    ).length;

    if (recentErrorCount > 10) {
      this.triggerAlert('high_error_rate', {
        count: recentErrorCount,
        threshold: 10,
      });
    }
  }

  triggerAlert(type, data) {
    const alertEvent = new CustomEvent('app:alert', {
      detail: { type, data, timestamp: new Date().toISOString() },
    });

    window.dispatchEvent(alertEvent);

    // Log alert
    console.warn(`🚨 Alert triggered: ${type}`, data);
  }

  showCriticalErrorNotification(error) {
    // Show user-friendly notification for critical errors
    const notification = document.createElement('div');
    notification.className = 'critical-error-notification';
    notification.innerHTML = `
      <div class="critical-error-content">
        <strong>Critical Error</strong>
        <p>Something went wrong. Please refresh the page or try again later.</p>
        <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Utility methods
  getMemoryInfo() {
    if ('memory' in performance) {
      const mem = performance.memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }

  getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return null;
  }

  getSessionId() {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  getCurrentUserId() {
    // Get current user ID from your auth system
    if (window.auth && window.auth.currentUser) {
      return window.auth.currentUser.id;
    }
    return null;
  }
}

// Create global instance
export const globalErrorHandler = new GlobalErrorHandler();

// Helper function to report errors manually
export function reportError(error, options = {}) {
  return globalErrorHandler.handleError({
    message: error.message || error.toString(),
    error,
    severity: options.severity || ERROR_SEVERITY.MEDIUM,
    category: options.category || ERROR_CATEGORY.UNKNOWN,
    type: options.type || 'manual',
    ...options,
  });
}

// Helper function to create user-friendly error messages
export function createUserFriendlyMessage(error, category) {
  const messages = {
    [ERROR_CATEGORY.NETWORK]:
      'Connection problem. Please check your internet and try again.',
    [ERROR_CATEGORY.AUTHENTICATION]: 'Please log in again to continue.',
    [ERROR_CATEGORY.AUTHORIZATION]:
      "You don't have permission to perform this action.",
    [ERROR_CATEGORY.VALIDATION]: 'Please check your input and try again.',
    [ERROR_CATEGORY.EXTERNAL_SERVICE]:
      'External service is temporarily unavailable. Please try again later.',
    [ERROR_CATEGORY.RENDERING]:
      'Display error occurred. Please refresh the page.',
    [ERROR_CATEGORY.PERFORMANCE]:
      'The application is running slowly. Please try again.',
    [ERROR_CATEGORY.SECURITY]:
      'Security error occurred. Please refresh the page.',
  };

  return (
    messages[category] || 'An unexpected error occurred. Please try again.'
  );
}

export default globalErrorHandler;
