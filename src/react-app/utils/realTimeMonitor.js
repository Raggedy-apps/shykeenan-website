import { performanceMonitor } from './performance.js';
import { globalErrorHandler } from './errorHandler.js';

class RealTimeMonitor {
  constructor() {
    this.events = [];
    this.maxEvents = 1000;
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.startTime = Date.now();
    this.isTracking = false;
    this.trackers = new Map();
    this.eventListeners = [];
  }

  // Initialize real-time monitoring
  init() {
    if (this.isTracking) return;

    this.isTracking = true;
    this.setupEventTracking();
    this.setupUserInteractionTracking();
    this.setupPerformanceEventTracking();
    this.setupCustomEventTracking();
    this.startPeriodicReporting();

    console.log('Real-time monitoring initialized');
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get user ID (implement based on your auth system)
  getUserId() {
    // Try to get from auth system
    if (window.auth && window.auth.currentUser) {
      return window.auth.currentUser.id;
    }

    // Fallback to stored ID or generate anonymous one
    let userId = localStorage.getItem('rt_user_id');
    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rt_user_id', userId);
    }

    return userId;
  }

  // Setup automatic event tracking
  setupEventTracking() {
    if (typeof document === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', {
        sessionDuration: Date.now() - this.startTime,
      });
    });

    // Track scroll events (throttled)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          maxScroll: Math.max(
            document.body.scrollHeight - window.innerHeight,
            0
          ),
        });
        scrollTimeout = null;
      }, 250);
    });

    // Track resize events
    window.addEventListener('resize', () => {
      this.trackEvent('resize', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });
  }

  // Setup user interaction tracking
  setupUserInteractionTracking() {
    if (typeof document === 'undefined') return;

    // Track clicks (with privacy considerations)
    document.addEventListener('click', (event) => {
      const target = event.target;
      const elementInfo = {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        textContent: target.textContent?.substring(0, 50), // Limit text length
      };

      // Don't track sensitive elements
      if (target.type === 'password' || target.type === 'email') {
        elementInfo.textContent = '[REDACTED]';
      }

      this.trackEvent('click', elementInfo);
    });

    // Track form interactions
    document.addEventListener('focusin', (event) => {
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.trackEvent('form_focus', {
          fieldType: target.type,
          fieldName: target.name,
        });
      }
    });

    // Track navigation events
    window.addEventListener('popstate', (event) => {
      this.trackEvent('navigation', {
        state: event.state,
        url: window.location.href,
      });
    });
  }

  // Setup performance event tracking
  setupPerformanceEventTracking() {
    // Track when performance metrics exceed thresholds
    window.addEventListener('performance:budget-alert', (event) => {
      this.trackEvent('performance_budget_alert', event.detail);
    });

    // Track memory pressure
    if ('memory' in performance) {
      const checkMemoryPressure = () => {
        const memInfo = performance.memory;
        const usagePercent =
          (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;

        if (usagePercent > 80) {
          this.trackEvent('memory_pressure', {
            usagePercent,
            used: memInfo.usedJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
          });
        }
      };

      setInterval(checkMemoryPressure, 10000);
    }
  }

  // Setup custom event tracking
  setupCustomEventTracking() {
    // Listen for custom events that components can dispatch
    const customEvents = [
      'feature:used',
      'error:retry',
      'modal:opened',
      'modal:closed',
      'search:performed',
      'filter:applied',
      'export:started',
      'export:completed',
    ];

    customEvents.forEach((eventName) => {
      window.addEventListener(eventName, (event) => {
        this.trackEvent(eventName, event.detail || {});
      });
    });
  }

  // Track custom event
  trackEvent(eventName, data = {}) {
    const event = {
      id: this.generateEventId(),
      sessionId: this.sessionId,
      userId: this.userId,
      name: eventName,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Record as performance metric
    performanceMonitor.recordMetric(`event-${eventName}`, 1, {
      sessionId: this.sessionId,
      userId: this.userId,
    });

    // Send to external analytics if available
    this.sendToAnalytics(event);

    return event.id;
  }

  // Generate unique event ID
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Send to analytics service
  sendToAnalytics(event) {
    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', event.name, {
        custom_parameter_1: event.sessionId,
        custom_parameter_2: event.userId,
        value: 1,
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(event);
  }

  // Send to custom analytics endpoint
  async sendToCustomAnalytics(event) {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }).catch(() => {
          // Silently fail
        });
      }
    } catch {
      // Ignore network errors
    }
  }

  // Start periodic reporting
  startPeriodicReporting() {
    // Report session metrics every 30 seconds
    setInterval(() => {
      this.reportSessionMetrics();
    }, 30000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportSessionMetrics();
    });
  }

  // Report session metrics
  reportSessionMetrics() {
    const sessionDuration = Date.now() - this.startTime;
    const eventCount = this.events.length;
    const uniqueEvents = new Set(this.events.map((e) => e.name)).size;

    const sessionMetrics = {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: sessionDuration,
      eventCount,
      uniqueEventTypes: uniqueEvents,
      avgEventsPerMinute: (eventCount / (sessionDuration / 60000)).toFixed(2),
      topEvents: this.getTopEvents(),
      timestamp: new Date().toISOString(),
    };

    // Send session metrics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'session_metrics', sessionMetrics);
    }

    // Store locally for debugging
    try {
      localStorage.setItem(
        'rt_session_metrics',
        JSON.stringify(sessionMetrics)
      );
    } catch {
      // Ignore storage errors
    }
  }

  // Get most frequent events
  getTopEvents(count = 5) {
    const eventCounts = {};
    this.events.forEach((event) => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([name, count]) => ({ name, count }));
  }

  // Get user behavior summary
  getBehaviorSummary() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.events.filter((e) => e.timestamp > lastHour);
    const dailyEvents = this.events.filter((e) => e.timestamp > last24Hours);

    const eventTypes = {};
    const hourlyActivity = {};

    recentEvents.forEach((event) => {
      // Count by event type
      eventTypes[event.name] = (eventTypes[event.name] || 0) + 1;

      // Track hourly activity
      const hour = new Date(event.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      totalEvents: this.events.length,
      lastHourEvents: recentEvents.length,
      last24HoursEvents: dailyEvents.length,
      eventBreakdown: eventTypes,
      hourlyActivity,
      sessionDuration: now - this.startTime,
      topEventTypes: Object.entries(eventTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    };
  }

  // Export event data
  exportEvents() {
    const exportData = {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      endTime: Date.now(),
      events: this.events,
      summary: this.getBehaviorSummary(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-events-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear event data
  clearEvents() {
    this.events = [];
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
  }

  // Stop monitoring
  stop() {
    this.isTracking = false;

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });

    this.eventListeners = [];

    console.log('Real-time monitoring stopped');
  }
}

// Create global instance
export const realTimeMonitor = new RealTimeMonitor();

// Helper function to track custom events
export function trackCustomEvent(eventName, data = {}) {
  return realTimeMonitor.trackEvent(eventName, data);
}

// Helper function to track feature usage
export function trackFeatureUsage(featureName, metadata = {}) {
  return realTimeMonitor.trackEvent('feature:used', {
    feature: featureName,
    ...metadata,
  });
}

// Helper function to track errors with context
export function trackErrorWithContext(error, context = {}) {
  return realTimeMonitor.trackEvent('error:occurred', {
    message: error.message || error.toString(),
    stack: error.stack,
    ...context,
  });
}

export default realTimeMonitor;
