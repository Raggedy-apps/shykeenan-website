import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performance.js';
import { globalErrorHandler } from '../utils/errorHandler.js';
import healthChecker from '../utils/healthCheck.js';

const MonitoringDashboard = ({ isVisible = false, onClose }) => {
  const [metrics, setMetrics] = useState({});
  const [healthStatus, setHealthStatus] = useState({});
  const [errorLog, setErrorLog] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const updateDashboard = () => {
      setMetrics(performanceMonitor.getMetrics());
      setHealthStatus(healthChecker.getHealthReport());
      setErrorLog(globalErrorHandler.getStoredErrors().slice(-10));
      setIsLoading(false);
    };

    updateDashboard();
    const interval = setInterval(updateDashboard, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    return `${(ms || 0).toFixed(2)}ms`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div className="monitoring-dashboard-overlay">
      <div className="monitoring-dashboard">
        <div className="monitoring-dashboard__header">
          <h2>System Monitoring</h2>
          <button
            className="monitoring-dashboard__close"
            onClick={onClose}
            aria-label="Close monitoring dashboard"
          >
            ×
          </button>
        </div>

        <div className="monitoring-dashboard__tabs">
          <button
            className={`monitoring-dashboard__tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`monitoring-dashboard__tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button
            className={`monitoring-dashboard__tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            Health
          </button>
          <button
            className={`monitoring-dashboard__tab ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Errors
          </button>
        </div>

        <div className="monitoring-dashboard__content">
          {isLoading ? (
            <div className="monitoring-dashboard__loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="monitoring-dashboard__overview">
                  <div className="monitoring-dashboard__section">
                    <h3>System Status</h3>
                    <div className="status-grid">
                      <div className="status-item">
                        <span className="status-label">Health Status:</span>
                        <span
                          className="status-value"
                          style={{
                            color: getStatusColor(
                              healthStatus.healthy ? 'healthy' : 'error'
                            ),
                          }}
                        >
                          {healthStatus.healthy ? '✅ Healthy' : '❌ Issues'}
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Uptime:</span>
                        <span className="status-value">
                          {healthStatus.uptime?.formatted || 'Unknown'}
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Total Errors:</span>
                        <span className="status-value">{errorLog.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="monitoring-dashboard__section">
                    <h3>Quick Stats</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">
                          {healthStatus.total || 0}
                        </div>
                        <div className="stat-label">Health Checks</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {healthStatus.successful || 0}
                        </div>
                        <div className="stat-label">Passing</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {healthStatus.failed || 0}
                        </div>
                        <div className="stat-label">Failing</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="monitoring-dashboard__performance">
                  <h3>Performance Metrics</h3>
                  <div className="metrics-grid">
                    {Object.entries(metrics).map(([key, metric]) => (
                      <div key={key} className="metric-item">
                        <div className="metric-name">{key}</div>
                        <div className="metric-value">
                          {key.includes('memory')
                            ? formatBytes(metric.value)
                            : formatDuration(metric.value)}
                        </div>
                        <div className="metric-timestamp">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="monitoring-dashboard__health">
                  <h3>Health Checks</h3>
                  <div className="health-checks">
                    {healthStatus.checks &&
                      Object.entries(healthStatus.checks).map(
                        ([name, check]) => (
                          <div
                            key={name}
                            className={`health-check ${check.success ? 'success' : 'error'}`}
                          >
                            <div className="health-check__name">{name}</div>
                            <div className="health-check__status">
                              {check.success ? '✅' : '❌'}
                            </div>
                            <div className="health-check__duration">
                              {formatDuration(check.duration)}
                            </div>
                            <div className="health-check__timestamp">
                              {check.timestamp
                                ? new Date(check.timestamp).toLocaleTimeString()
                                : 'Never'}
                            </div>
                            {check.error && (
                              <div className="health-check__error">
                                {check.error}
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}

              {activeTab === 'errors' && (
                <div className="monitoring-dashboard__errors">
                  <h3>Recent Errors</h3>
                  <div className="error-log">
                    {errorLog.length === 0 ? (
                      <p>No recent errors</p>
                    ) : (
                      errorLog.map((error, index) => (
                        <div
                          key={error.errorId || index}
                          className="error-item"
                        >
                          <div className="error-header">
                            <span className="error-id">{error.errorId}</span>
                            <span className="error-timestamp">
                              {new Date(error.timestamp).toLocaleString()}
                            </span>
                            <span
                              className={`error-severity severity-${error.severity}`}
                            >
                              {error.severity}
                            </span>
                          </div>
                          <div className="error-message">{error.message}</div>
                          <div className="error-category">
                            Category: {error.category}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
