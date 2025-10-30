import React, { useState, useEffect } from 'react';
import { useSecureAdmin } from '../context/SecureAdminContext.jsx';

export default function SecurityMonitor() {
  const { isAuthenticated } = useSecureAdmin();
  const [securityData, setSecurityData] = useState({
    rateLimitStatus: {},
    blockedClients: [],
    abuseReports: [],
    sessionInfo: null,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch security data
  const fetchSecurityData = async () => {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        rateLimitStatus: window.rateLimiter
          ? {
              API_GENERAL: window.rateLimiter.getRateLimitStatus('API_GENERAL'),
              API_AUTH: window.rateLimiter.getRateLimitStatus('API_AUTH'),
              CONTACT_FORM:
                window.rateLimiter.getRateLimitStatus('CONTACT_FORM'),
              SEARCH: window.rateLimiter.getRateLimitStatus('SEARCH'),
            }
          : {},
        blockedClients: window.rateLimiter
          ? window.rateLimiter.getBlockedClients()
          : [],
        sessionInfo: window.auth ? window.auth.getSessionInfo() : null,
        securityEvents: window.securityMonitor
          ? window.securityMonitor.getEvents({ timeRange: 60 * 60 * 1000 })
          : [], // Last hour
        securitySummary: window.securityMonitor
          ? window.securityMonitor.getSecuritySummary()
          : {},
      };

      setSecurityData(data);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    }
  };

  // Setup auto-refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, refreshInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshInterval]);

  const handleUnblockClient = (clientId) => {
    if (window.rateLimiter) {
      window.rateLimiter.unblockClient(clientId);
      fetchSecurityData(); // Refresh data
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!isAuthenticated) {
    return (
      <div className="security-monitor-unauthorized">
        <p>Authentication required to view security monitoring data.</p>
      </div>
    );
  }

  return (
    <div className="security-monitor">
      <div className="security-monitor-header">
        <h2>Security Monitor</h2>
        <div className="monitor-controls">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button onClick={fetchSecurityData} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="security-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Security Events ({securityData.securityEvents.length})
        </button>
        <button
          className={activeTab === 'rate-limits' ? 'active' : ''}
          onClick={() => setActiveTab('rate-limits')}
        >
          Rate Limits
        </button>
        <button
          className={activeTab === 'blocked' ? 'active' : ''}
          onClick={() => setActiveTab('blocked')}
        >
          Blocked Clients ({securityData.blockedClients.length})
        </button>
        <button
          className={activeTab === 'session' ? 'active' : ''}
          onClick={() => setActiveTab('session')}
        >
          Session Info
        </button>
      </div>

      <div className="security-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="security-stats">
              <div className="stat-card">
                <h3>Active Sessions</h3>
                <p className="stat-value">
                  {securityData.sessionInfo ? '1' : '0'}
                </p>
              </div>
              <div className="stat-card">
                <h3>Blocked Clients</h3>
                <p className="stat-value">
                  {securityData.blockedClients.length}
                </p>
              </div>
              <div className="stat-card">
                <h3>Rate Limited</h3>
                <p className="stat-value">
                  {
                    Object.values(securityData.rateLimitStatus).filter(
                      (status) => status && status.current > status.limit * 0.8
                    ).length
                  }
                </p>
              </div>
              <div className="stat-card">
                <h3>Security Events (1h)</h3>
                <p className="stat-value">
                  {securityData.securitySummary.lastHourEvents || 0}
                </p>
              </div>
            </div>

            {securityData.securitySummary.eventBreakdown && (
              <div className="event-breakdown">
                <h3>Recent Event Types</h3>
                <div className="event-types">
                  {Object.entries(
                    securityData.securitySummary.eventBreakdown
                  ).map(([type, count]) => (
                    <div key={type} className="event-type">
                      <span className="event-label">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="event-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-tab">
            <div className="events-header">
              <h3>Security Events</h3>
              <div className="events-controls">
                <button
                  onClick={() => window.securityMonitor?.exportSecurityLog()}
                  className="export-button"
                >
                  Export Log
                </button>
                <button
                  onClick={() => window.securityMonitor?.clearEvents()}
                  className="clear-button"
                >
                  Clear Events
                </button>
              </div>
            </div>

            {securityData.securityEvents.length === 0 ? (
              <p className="no-events">No security events in the last hour.</p>
            ) : (
              <div className="events-list">
                {securityData.securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`security-event ${event.type}`}
                  >
                    <div className="event-header">
                      <span className="event-type">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="event-time">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>Client:</strong>{' '}
                        {event.clientId?.substring(0, 8)}...
                      </p>
                      {event.details.reason && (
                        <p>
                          <strong>Reason:</strong> {event.details.reason}
                        </p>
                      )}
                      {event.details.form && (
                        <p>
                          <strong>Form:</strong> {event.details.form}
                        </p>
                      )}
                      {event.url && (
                        <p>
                          <strong>URL:</strong> {event.url}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rate-limits' && (
          <div className="rate-limits-tab">
            <h3>Rate Limit Status</h3>
            <div className="rate-limit-grid">
              {Object.entries(securityData.rateLimitStatus).map(
                ([endpoint, status]) => (
                  <div key={endpoint} className="rate-limit-card">
                    <h4>{endpoint.replace(/_/g, ' ')}</h4>
                    {status ? (
                      <div className="rate-limit-info">
                        <div className="rate-progress">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(status.current / status.limit) * 100}%`,
                              backgroundColor:
                                status.current > status.limit * 0.8
                                  ? '#ff6b6b'
                                  : '#4ecdc4',
                            }}
                          />
                        </div>
                        <p>
                          {status.current} / {status.limit} requests
                        </p>
                        <p className="remaining">
                          Remaining: {status.remaining}
                        </p>
                        <p className="reset">
                          Resets: {formatTime(status.resetTime)}
                        </p>
                      </div>
                    ) : (
                      <p className="no-data">No data available</p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="blocked-tab">
            <h3>Blocked Clients</h3>
            {securityData.blockedClients.length === 0 ? (
              <p className="no-blocked">No clients currently blocked.</p>
            ) : (
              <div className="blocked-list">
                {securityData.blockedClients.map((client) => (
                  <div key={client.clientId} className="blocked-client">
                    <div className="client-info">
                      <strong>Client ID:</strong>{' '}
                      {client.clientId.substring(0, 8)}...
                      <br />
                      <strong>Reason:</strong> {client.reason}
                      <br />
                      <strong>Blocked At:</strong>{' '}
                      {formatTime(Date.now() - client.remainingTime)}
                      <br />
                      <strong>Remaining:</strong>{' '}
                      {formatDuration(client.remainingTime)}
                    </div>
                    <button
                      onClick={() => handleUnblockClient(client.clientId)}
                      className="unblock-button"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'session' && (
          <div className="session-tab">
            <h3>Current Session</h3>
            {securityData.sessionInfo ? (
              <div className="session-info">
                <p>
                  <strong>Session ID:</strong> {securityData.sessionInfo.id}
                </p>
                <p>
                  <strong>User:</strong> {securityData.sessionInfo.user}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {formatTime(securityData.sessionInfo.created)}
                </p>
                <p>
                  <strong>Last Activity:</strong>{' '}
                  {formatTime(securityData.sessionInfo.lastActivity)}
                </p>
                <p>
                  <strong>Expires:</strong>{' '}
                  {formatTime(securityData.sessionInfo.expires)}
                </p>
                <p>
                  <strong>Time Remaining:</strong>{' '}
                  {formatDuration(
                    securityData.sessionInfo.expires - Date.now()
                  )}
                </p>
              </div>
            ) : (
              <p>No active session</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
