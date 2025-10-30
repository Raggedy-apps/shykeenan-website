// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  // Track Web Vitals
  trackWebVitals() {
    if (!('PerformanceObserver' in window)) {
      console.warn('Performance Observer not supported');
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
        this.checkBudget('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('fcp', lastEntry.startTime);
        this.checkBudget('fcp', lastEntry.startTime);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
          this.checkBudget('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('cls', clsValue);
            this.checkBudget('cls', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Time to First Byte (TTFB)
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.responseStart > 0) {
            const ttfb = entry.responseStart - entry.requestStart;
            this.recordMetric('ttfb', ttfb);
            this.checkBudget('ttfb', ttfb);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation timing observer not supported');
    }
  }

  // Track custom metrics
  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      url: window.location.href,
    };

    this.metrics.set(name, metric);

    // Send to analytics (if available)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        name,
        value: Math.round(value),
        event_category: 'Performance',
      });
    }

    // Log for debugging
    console.log(`Performance: ${name} = ${value}`, tags);
  }

  // Track component render time
  timeComponent(componentName, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.recordMetric(`component-render-${componentName}`, end - start);
    return result;
  }

  // Track memory usage
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const usagePercent =
        (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;

      this.recordMetric('memory-used', memInfo.usedJSHeapSize);
      this.recordMetric('memory-total', memInfo.totalJSHeapSize);
      this.recordMetric('memory-limit', memInfo.jsHeapSizeLimit);
      this.recordMetric('memory-usage-percent', usagePercent);

      this.checkBudget('memoryUsage', memInfo.usedJSHeapSize);
    }
  }

  // Track DOM metrics
  trackDOMMetrics() {
    try {
      const elementCount = document.getElementsByTagName('*').length;
      const maxDepth = this.getDOMDepth();
      const idCount = document.querySelectorAll('[id]').length;
      const classCount = document.querySelectorAll('[class]').length;

      this.recordMetric('dom-element-count', elementCount);
      this.recordMetric('dom-max-depth', maxDepth);
      this.recordMetric('dom-id-count', idCount);
      this.recordMetric('dom-class-count', classCount);

      this.checkBudget('domElements', elementCount);
    } catch (e) {
      console.warn('DOM metrics tracking failed:', e);
    }
  }

  // Get DOM depth
  getDOMDepth() {
    function getDepth(element, depth = 0) {
      if (!element || !element.children) return depth;
      let maxChildDepth = depth;
      for (let child of element.children) {
        maxChildDepth = Math.max(maxChildDepth, getDepth(child, depth + 1));
      }
      return maxChildDepth;
    }
    return getDepth(document.body);
  }

  // Track network requests
  trackNetworkRequests() {
    if (!('fetch' in window) && !XMLHttpRequest.prototype) return;

    let requestCount = 0;
    const originalFetch = window.fetch;
    const originalXMLHttpRequest = window.XMLHttpRequest;

    // Track fetch requests
    if (originalFetch) {
      window.fetch = function (...args) {
        requestCount++;
        const startTime = performance.now();

        return originalFetch
          .apply(this, args)
          .then((result) => {
            const duration = performance.now() - startTime;
            performanceMonitor.recordMetric('fetch-duration', duration, {
              url: args[0]?.url || args[0],
              status: result.status,
            });
            return result;
          })
          .catch((error) => {
            const duration = performance.now() - startTime;
            performanceMonitor.recordMetric('fetch-error', duration, {
              url: args[0]?.url || args[0],
              error: error.message,
            });
            throw error;
          });
      };
    }

    // Track XMLHttpRequest
    if (originalXMLHttpRequest) {
      const OriginalXHR = originalXMLHttpRequest;
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        const originalSend = xhr.send;
        const originalOpen = xhr.open;

        xhr.open = function (method, url) {
          xhr._startTime = performance.now();
          xhr._url = url;
          return originalOpen.apply(this, arguments);
        };

        xhr.send = function (body) {
          requestCount++;
          const sendTime = performance.now();

          xhr.addEventListener('loadend', () => {
            const duration = performance.now() - xhr._startTime;
            performanceMonitor.recordMetric('xhr-duration', duration, {
              url: xhr._url,
              method: xhr._method || 'GET',
              status: xhr.status,
            });
          });

          return originalSend.apply(this, arguments);
        };

        return xhr;
      };
    }

    // Track request count
    setInterval(() => {
      if (requestCount > 0) {
        this.recordMetric('request-count', requestCount);
        this.checkBudget('requestCount', requestCount);
        requestCount = 0;
      }
    }, 10000); // Every 10 seconds
  }

  // Check performance budget
  checkBudget(metric, value) {
    const budget = PERFORMANCE_BUDGETS[metric];
    if (!budget) return true;

    const isWithinBudget = value <= budget;

    if (!isWithinBudget) {
      const severity = this.getBudgetSeverity(metric, value, budget);

      // Record budget violation
      this.recordMetric(`budget-violation-${metric}`, value, {
        budget,
        severity,
        overBy: value - budget,
      });

      // Send alert for budget violations
      this.sendBudgetAlert(metric, value, budget, severity);

      console.warn(
        `🚨 Performance budget exceeded for ${metric}: ${value} > ${budget}`
      );
    }

    return isWithinBudget;
  }

  // Get budget violation severity
  getBudgetSeverity(metric, value, budget) {
    const overBy = value - budget;
    const overByPercent = (overBy / budget) * 100;

    if (overByPercent > 50) return 'critical';
    if (overByPercent > 25) return 'high';
    if (overByPercent > 10) return 'medium';
    return 'low';
  }

  // Send budget alert
  sendBudgetAlert(metric, value, budget, severity) {
    const alertData = {
      metric,
      value,
      budget,
      severity,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Send to global error handler
    if (window.globalErrorHandler) {
      window.globalErrorHandler.handleError({
        type: 'performance_budget_violation',
        message: `Performance budget exceeded: ${metric} ${value} > ${budget}`,
        severity,
        category: 'performance',
        alertData,
      });
    }

    // Dispatch custom event for other listeners
    window.dispatchEvent(
      new CustomEvent('performance:budget-alert', {
        detail: alertData,
      })
    );
  }

  // Track bundle load times
  trackBundleLoad(bundleName, loadTime) {
    this.recordMetric(`bundle-load-${bundleName}`, loadTime);
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: this.getMetrics(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Add navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        report.navigation = {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.navigationStart,
        };
      }
    }

    return report;
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  lcp: 2500, // 2.5 seconds
  fid: 100, // 100 milliseconds
  cls: 0.1, // 0.1 cumulative layout shift
  fcp: 1800, // 1.8 seconds First Contentful Paint
  ttfb: 800, // 800ms Time to First Byte
  bundleSize: 100 * 1024, // 100KB per bundle
  totalSize: 500 * 1024, // 500KB total
  memoryUsage: 50 * 1024 * 1024, // 50MB memory limit
  domElements: 1500, // Max DOM elements
  requestCount: 50, // Max requests per page
};

// Check if performance is within budget
export function checkPerformanceBudget(metric, value) {
  const budget = PERFORMANCE_BUDGETS[metric];
  if (budget && value > budget) {
    console.warn(
      `Performance budget exceeded for ${metric}: ${value} > ${budget}`
    );
    return false;
  }
  return true;
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  // Make global for debugging
  window.performanceMonitor = performanceMonitor;

  // Wait for page load
  if (document.readyState === 'complete') {
    startMonitoring();
  } else {
    window.addEventListener('load', startMonitoring);
  }
}

function startMonitoring() {
  // Core Web Vitals tracking
  performanceMonitor.trackWebVitals();

  // Memory usage tracking
  performanceMonitor.trackMemoryUsage();
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 30000); // Every 30 seconds

  // DOM metrics tracking
  performanceMonitor.trackDOMMetrics();
  setInterval(() => {
    performanceMonitor.trackDOMMetrics();
  }, 60000); // Every minute

  // Network request tracking
  performanceMonitor.trackNetworkRequests();

  // Resource timing tracking
  trackResourceTiming();

  // Long task tracking
  trackLongTasks();

  console.log('🚀 Comprehensive performance monitoring initialized');
}

// Track resource loading performance
function trackResourceTiming() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 1000) {
          // Only track slow resources
          performanceMonitor.recordMetric('slow-resource', entry.duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0,
          });
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
    performanceMonitor.observers.push(resourceObserver);
  } catch (e) {
    console.warn('Resource timing observer not supported');
  }
}

// Track long tasks
function trackLongTasks() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        performanceMonitor.recordMetric('long-task', entry.duration, {
          startTime: entry.startTime,
          name: entry.name,
        });

        // Alert on very long tasks
        if (entry.duration > 100) {
          console.warn('🚨 Long task detected:', entry);
        }
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    performanceMonitor.observers.push(longTaskObserver);
  } catch (e) {
    console.warn('Long task observer not supported');
  }
}

// Export for use in components
export default performanceMonitor;
