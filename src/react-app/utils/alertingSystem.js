import { globalErrorHandler } from './errorHandler.js';
import { performanceMonitor } from './performance.js';

class AlertingSystem {
  constructor() {
    this.alerts = [];
    this.maxAlerts = 100;
    this.subscribers = new Map();
    this.alertRules = new Map();
    this.isActive = false;
    this.notificationChannels = new Map();
  }

  // Initialize alerting system
  init() {
    if (this.isActive) return;

    this.isActive = true;
    this.setupDefaultAlertRules();
    this.setupEventListeners();
    this.startAlertProcessing();

    console.log('Alerting system initialized');
  }

  // Setup default alert rules
  setupDefaultAlertRules() {
    // Critical error rate rule
    this.addAlertRule('critical_error_rate', {
      condition: (metrics) => metrics.errorCount > 10,
      severity: 'critical',
      message: 'Critical error rate exceeded 10 errors per minute',
      channels: ['console', 'admin'],
      cooldown: 5 * 60 * 1000, // 5 minutes
    });

    // Performance degradation rule
    this.addAlertRule('performance_degradation', {
      condition: (metrics) => metrics.avgLCP > 4000 || metrics.avgFID > 200,
      severity: 'high',
      message: 'Performance metrics degraded significantly',
      channels: ['console', 'admin'],
      cooldown: 10 * 60 * 1000, // 10 minutes
    });

    // Memory usage rule
    this.addAlertRule('high_memory_usage', {
      condition: (metrics) => metrics.memoryUsagePercent > 85,
      severity: 'high',
      message: 'High memory usage detected',
      channels: ['console', 'admin'],
      cooldown: 2 * 60 * 1000, // 2 minutes
    });

    // Health check failures
    this.addAlertRule('health_check_failures', {
      condition: (metrics) => metrics.failedHealthChecks > 0,
      severity: 'medium',
      message: 'Health check failures detected',
      channels: ['console'],
      cooldown: 1 * 60 * 1000, // 1 minute
    });

    // User experience issues
    this.addAlertRule('user_experience_issues', {
      condition: (metrics) => metrics.layoutShifts > 5 || metrics.longTasks > 3,
      severity: 'medium',
      message: 'User experience issues detected',
      channels: ['console'],
      cooldown: 5 * 60 * 1000, // 5 minutes
    });
  }

  // Add alert rule
  addAlertRule(name, rule) {
    this.alertRules.set(name, {
      ...rule,
      name,
      lastTriggered: 0,
      enabled: true,
    });
  }

  // Setup event listeners for metrics
  setupEventListeners() {
    // Listen for error events
    window.addEventListener('error', (event) => {
      this.processMetricUpdate('error', { count: 1 });
    });

    // Listen for performance events
    window.addEventListener('performance:budget-alert', (event) => {
      this.processMetricUpdate('performance', event.detail);
    });

    // Listen for health check updates
    window.addEventListener('health:check-completed', (event) => {
      this.processMetricUpdate('health', event.detail);
    });

    // Listen for custom alert triggers
    window.addEventListener('alert:trigger', (event) => {
      this.triggerAlert(event.detail.name, event.detail.data);
    });
  }

  // Process metric updates
  processMetricUpdate(type, data) {
    // Store metrics for analysis
    const metricUpdate = {
      type,
      data,
      timestamp: Date.now(),
    };

    // Check against alert rules
    this.checkAlertRules(metricUpdate);
  }

  // Check if any alert rules should trigger
  checkAlertRules(metricUpdate) {
    const now = Date.now();
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes

    for (const [ruleName, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (now - rule.lastTriggered < rule.cooldown) continue;

      try {
        const shouldTrigger = rule.condition(recentMetrics);

        if (shouldTrigger) {
          this.triggerAlert(ruleName, {
            rule: rule.name,
            severity: rule.severity,
            message: rule.message,
            metrics: recentMetrics,
            timestamp: now,
          });

          rule.lastTriggered = now;
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${ruleName}:`, error);
      }
    }
  }

  // Get recent metrics for analysis
  getRecentMetrics(timeWindow = 5 * 60 * 1000) {
    const now = Date.now();
    const cutoff = now - timeWindow;

    // This would typically come from a metrics store
    // For now, we'll aggregate from performance monitor
    const metrics = performanceMonitor.getMetrics();

    return {
      errorCount: this.getRecentErrorCount(cutoff),
      avgLCP: metrics.lcp?.value || 0,
      avgFID: metrics.fid?.value || 0,
      memoryUsagePercent: metrics['memory-usage-percent']?.value || 0,
      layoutShifts: metrics.cls?.value || 0,
      longTasks: this.getRecentLongTaskCount(cutoff),
      failedHealthChecks: this.getRecentFailedHealthCheckCount(cutoff),
    };
  }

  // Helper methods for metrics calculation
  getRecentErrorCount(cutoff) {
    try {
      const errors = globalErrorHandler.getStoredErrors();
      return errors.filter(
        (error) => error.timestamp > new Date(cutoff).toISOString()
      ).length;
    } catch {
      return 0;
    }
  }

  getRecentLongTaskCount(cutoff) {
    // This would track long tasks in the last time window
    return 0; // Placeholder
  }

  getRecentFailedHealthCheckCount(cutoff) {
    // This would track failed health checks
    return 0; // Placeholder
  }

  // Trigger alert
  triggerAlert(ruleName, alertData) {
    const alert = {
      id: this.generateAlertId(),
      ruleName,
      data: alertData,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Send to notification channels
    this.sendToNotificationChannels(alert);

    // Store alert
    this.storeAlert(alert);

    console.warn(`🚨 ALERT [${ruleName}]:`, alertData);
  }

  // Generate unique alert ID
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Send alert to notification channels
  sendToNotificationChannels(alert) {
    const rule = this.alertRules.get(alert.ruleName);
    if (!rule) return;

    rule.channels.forEach((channel) => {
      const handler = this.notificationChannels.get(channel);
      if (handler) {
        try {
          handler(alert);
        } catch (error) {
          console.error(`Error sending alert to channel ${channel}:`, error);
        }
      }
    });
  }

  // Store alert locally
  storeAlert(alert) {
    try {
      const storedAlerts = this.getStoredAlerts();
      storedAlerts.push(alert);

      // Keep only last 50 alerts
      const recentAlerts = storedAlerts.slice(-50);

      localStorage.setItem('app_alerts', JSON.stringify(recentAlerts));
    } catch {
      // Ignore storage errors
    }
  }

  // Get stored alerts
  getStoredAlerts() {
    try {
      const stored = localStorage.getItem('app_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Start alert processing loop
  startAlertProcessing() {
    setInterval(() => {
      this.processStoredAlerts();
    }, 60000); // Every minute
  }

  // Process stored alerts
  processStoredAlerts() {
    const unacknowledgedAlerts = this.alerts.filter(
      (alert) => !alert.acknowledged
    );

    // Auto-acknowledge old alerts
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    unacknowledgedAlerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp).getTime();
      if (alertTime < oneHourAgo) {
        alert.acknowledged = true;
      }
    });
  }

  // Add notification channel
  addNotificationChannel(name, handler) {
    this.notificationChannels.set(name, handler);
  }

  // Setup default notification channels
  setupDefaultNotificationChannels() {
    // Console notifications
    this.addNotificationChannel('console', (alert) => {
      const severity = alert.data.severity || 'medium';
      const color = this.getSeverityColor(severity);
      console.log(
        `%c🚨 ${alert.ruleName}: ${alert.data.message}`,
        `color: ${color}`
      );
    });

    // Admin dashboard notifications
    this.addNotificationChannel('admin', (alert) => {
      // Dispatch event for admin dashboard
      window.dispatchEvent(
        new CustomEvent('admin:alert', {
          detail: alert,
        })
      );
    });

    // Webhook notifications (for production)
    this.addNotificationChannel('webhook', async (alert) => {
      try {
        if (process.env.NODE_ENV === 'production') {
          await fetch('/api/alerts/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(alert),
          });
        }
      } catch {
        // Ignore webhook failures
      }
    });

    // Email notifications (for critical alerts)
    this.addNotificationChannel('email', async (alert) => {
      if (alert.data.severity === 'critical') {
        try {
          await fetch('/api/alerts/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: 'admin@example.com', // Configure actual admin email
              subject: `Critical Alert: ${alert.ruleName}`,
              alert: alert,
            }),
          });
        } catch {
          // Ignore email failures
        }
      }
    });
  }

  // Get severity color for console output
  getSeverityColor(severity) {
    const colors = {
      low: '#2196F3',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0',
    };
    return colors[severity] || colors.medium;
  }

  // Get alert statistics
  getAlertStats(timeWindow = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const cutoff = now - timeWindow;

    const recentAlerts = this.alerts.filter(
      (alert) => new Date(alert.timestamp).getTime() > cutoff
    );

    const stats = {
      total: recentAlerts.length,
      bySeverity: {},
      byRule: {},
      acknowledged: 0,
      unacknowledged: 0,
    };

    recentAlerts.forEach((alert) => {
      const severity = alert.data.severity || 'unknown';
      const ruleName = alert.ruleName;

      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      stats.byRule[ruleName] = (stats.byRule[ruleName] || 0) + 1;

      if (alert.acknowledged) {
        stats.acknowledged++;
      } else {
        stats.unacknowledged++;
      }
    });

    return stats;
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // Get active alerts
  getActiveAlerts() {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }

  // Clear old alerts
  clearOldAlerts(olderThanDays = 7) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(
      (alert) => new Date(alert.timestamp).getTime() > cutoff
    );
  }
}

// Create global instance
export const alertingSystem = new AlertingSystem();

// Initialize with default channels
alertingSystem.setupDefaultNotificationChannels();

// Helper function to trigger custom alerts
export function triggerCustomAlert(name, data = {}) {
  window.dispatchEvent(
    new CustomEvent('alert:trigger', {
      detail: { name, data },
    })
  );
}

// Helper function to report metrics for alerting
export function reportMetricsForAlerting(type, data) {
  alertingSystem.processMetricUpdate(type, data);
}

export default alertingSystem;
