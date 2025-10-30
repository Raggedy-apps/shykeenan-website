import { performanceMonitor } from './performance.js';
import { globalErrorHandler } from './errorHandler.js';

export class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Register a health check
  registerCheck(name, checkFn, options = {}) {
    const check = {
      name,
      checkFn,
      interval: options.interval || 30000, // 30 seconds default
      timeout: options.timeout || 5000, // 5 seconds timeout
      critical: options.critical || false,
      lastResult: null,
      lastCheck: null,
      consecutiveFailures: 0,
    };

    this.checks.set(name, check);
    return this;
  }

  // Run a specific health check
  async runCheck(checkName) {
    const check = this.checks.get(checkName);
    if (!check) {
      throw new Error(`Health check '${checkName}' not found`);
    }

    const startTime = performance.now();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
    );

    try {
      const result = await Promise.race([check.checkFn(), timeoutPromise]);

      const duration = performance.now() - startTime;

      check.lastResult = {
        success: true,
        duration,
        timestamp: new Date().toISOString(),
        data: result,
      };
      check.lastCheck = Date.now();
      check.consecutiveFailures = 0;

      performanceMonitor.recordMetric(`health-check-${checkName}`, duration, {
        status: 'success',
      });

      return check.lastResult;
    } catch (error) {
      const duration = performance.now() - startTime;

      check.lastResult = {
        success: false,
        duration,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      check.lastCheck = Date.now();
      check.consecutiveFailures++;

      performanceMonitor.recordMetric(`health-check-${checkName}`, duration, {
        status: 'failed',
        error: error.message,
      });

      // Report critical health check failures
      if (check.critical) {
        globalErrorHandler.handleError({
          type: 'health_check_failure',
          message: `Critical health check '${checkName}' failed: ${error.message}`,
          severity: 'high',
          category: 'performance',
          checkName,
          consecutiveFailures: check.consecutiveFailures,
        });
      }

      return check.lastResult;
    }
  }

  // Run all health checks
  async runAllChecks() {
    const results = {};
    const promises = [];

    for (const [name, check] of this.checks.entries()) {
      promises.push(
        this.runCheck(name)
          .then((result) => {
            results[name] = result;
          })
          .catch((error) => {
            results[name] = {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          })
      );
    }

    await Promise.allSettled(promises);
    return results;
  }

  // Get health status summary
  getHealthSummary() {
    const checks = Array.from(this.checks.values());
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const totalChecks = checks.length;
    const successfulChecks = checks.filter(
      (check) => check.lastResult?.success
    ).length;
    const failedChecks = totalChecks - successfulChecks;
    const criticalFailures = checks.filter(
      (check) => check.critical && !check.lastResult?.success
    ).length;
    const staleChecks = checks.filter(
      (check) => !check.lastCheck || check.lastCheck < fiveMinutesAgo
    ).length;

    return {
      total: totalChecks,
      successful: successfulChecks,
      failed: failedChecks,
      criticalFailures,
      stale: staleChecks,
      healthy: failedChecks === 0 && staleChecks === 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Get detailed health report
  getHealthReport() {
    const summary = this.getHealthSummary();
    const checkDetails = {};

    for (const [name, check] of this.checks.entries()) {
      checkDetails[name] = {
        ...check.lastResult,
        consecutiveFailures: check.consecutiveFailures,
        critical: check.critical,
        interval: check.interval,
      };
    }

    return {
      ...summary,
      checks: checkDetails,
      uptime: this.getUptime(),
    };
  }

  // Get system uptime
  getUptime() {
    if (typeof performance !== 'undefined' && performance.timing) {
      const navigationStart = performance.timing.navigationStart;
      const uptime = Date.now() - navigationStart;
      return {
        milliseconds: uptime,
        formatted: this.formatDuration(uptime),
      };
    }
    return null;
  }

  // Format duration for display
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Start continuous monitoring
  startMonitoring(interval = 60000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, interval);

    console.log('Health monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Health monitoring stopped');
  }

  // Setup default health checks
  setupDefaultChecks() {
    // Memory usage check
    this.registerCheck(
      'memory_usage',
      () => {
        if ('memory' in performance) {
          const mem = performance.memory;
          const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

          if (usagePercent > 90) {
            throw new Error(`High memory usage: ${usagePercent.toFixed(1)}%`);
          }

          return {
            used: mem.usedJSHeapSize,
            total: mem.totalJSHeapSize,
            limit: mem.jsHeapSizeLimit,
            usagePercent: usagePercent.toFixed(1),
          };
        }
        throw new Error('Memory monitoring not available');
      },
      { critical: true, interval: 10000 }
    );

    // Network connectivity check
    this.registerCheck(
      'network_connectivity',
      async () => {
        try {
          const response = await fetch('/api/health', {
            method: 'HEAD',
            timeout: 3000,
          });
          return {
            status: response.status,
            statusText: response.statusText,
          };
        } catch (error) {
          throw new Error(`Network check failed: ${error.message}`);
        }
      },
      { critical: true }
    );

    // Local storage availability
    this.registerCheck('local_storage', () => {
      try {
        const testKey = '__health_check_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return { available: true };
      } catch (error) {
        throw new Error(`Local storage not available: ${error.message}`);
      }
    });

    // Service worker status
    this.registerCheck('service_worker', () => {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker
          .getRegistration()
          .then((registration) => ({
            registered: !!registration,
            state: registration?.active?.state || 'none',
          }));
      }
      return { available: false, reason: 'Service Worker not supported' };
    });

    // WebSocket connectivity (if applicable)
    this.registerCheck('websocket_connectivity', () => {
      // Placeholder for WebSocket health check
      // Implement based on your WebSocket usage
      return { status: 'not_implemented' };
    });

    return this;
  }
}

// Create global health checker instance
export const healthChecker = new HealthChecker();

// Initialize with default checks
healthChecker.setupDefaultChecks();

// Health check endpoint for external monitoring
export async function healthCheckEndpoint(req) {
  try {
    const results = await healthChecker.runAllChecks();
    const summary = healthChecker.getHealthSummary();

    return {
      status: summary.healthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: summary.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        summary,
        checks: results,
      }),
    };
  } catch (error) {
    return {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
    };
  }
}

export default healthChecker;
