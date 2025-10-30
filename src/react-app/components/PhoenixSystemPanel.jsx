import { useCallback, useEffect, useState } from 'react';
import { getPhoenixCore } from '../../js/phoenix/index.js';

export default function PhoenixSystemPanel() {
  const [phoenixCore, setPhoenixCore] = useState(null);
  const [systemState, setSystemState] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const core = getPhoenixCore();
    setPhoenixCore(core);

    if (core && core.initialized) {
      loadSystemData(core);
    }

    setLoading(false);
  }, []);

  const loadSystemData = useCallback(async (core) => {
    try {
      const state = core.getStateSnapshot();
      const debug = core.getDebugInfo();
      const logs = core.auditLogger?.getLogs({ limit: 20 }) || [];

      setSystemState(state);
      setDebugInfo(debug);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load Phoenix system data:', error);
    }
  }, []);

  const handleExportAuditLog = useCallback(async () => {
    if (!phoenixCore) return;

    try {
      await phoenixCore.exportAuditLog();
    } catch (error) {
      console.error('Failed to export audit log:', error);
    }
  }, [phoenixCore]);

  const handleExportSystemState = useCallback(async () => {
    if (!phoenixCore) return;

    try {
      const data = await phoenixCore.exportSystemState();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `phoenix-system-state-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export system state:', error);
    }
  }, [phoenixCore]);

  const handleRefresh = useCallback(() => {
    if (phoenixCore) {
      loadSystemData(phoenixCore);
    }
  }, [phoenixCore, loadSystemData]);

  if (loading) {
    return (
      <div className="phoenix-panel-loading">
        <div className="loading-spinner"></div>
        <p>Loading Phoenix System...</p>
      </div>
    );
  }

  if (!phoenixCore || !phoenixCore.initialized) {
    return (
      <div className="phoenix-panel-error">
        <h3>Phoenix System Not Available</h3>
        <p>
          The Phoenix system is not initialized or not available. This could be
          due to initialization errors or the system being disabled.
        </p>
      </div>
    );
  }

  return (
    <div className="phoenix-system-panel">
      <div className="phoenix-panel-header">
        <div className="phoenix-panel-title">
          <h2>Phoenix System</h2>
          <div className="phoenix-status">
            <span
              className={`status-indicator status-${systemState?.initialized ? 'active' : 'inactive'}`}
            >
              {systemState?.initialized ? 'Active' : 'Inactive'}
            </span>
            <span className="version">v{systemState?.version}</span>
          </div>
        </div>

        <div className="phoenix-panel-actions">
          <button onClick={handleRefresh} className="btn btn-secondary">
            Refresh
          </button>
          <button onClick={handleExportAuditLog} className="btn btn-primary">
            Export Audit Log
          </button>
          <button onClick={handleExportSystemState} className="btn btn-primary">
            Export System State
          </button>
        </div>
      </div>

      <div className="phoenix-panel-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'subsystems' ? 'active' : ''}`}
          onClick={() => setActiveTab('subsystems')}
        >
          Subsystems
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
        <button
          className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          Debug
        </button>
      </div>

      <div className="phoenix-panel-content">
        {activeTab === 'overview' && (
          <OverviewPanel systemState={systemState} />
        )}

        {activeTab === 'subsystems' && (
          <SubsystemsPanel systemState={systemState} />
        )}

        {activeTab === 'audit' && <AuditLogPanel auditLogs={auditLogs} />}

        {activeTab === 'debug' && <DebugPanel debugInfo={debugInfo} />}
      </div>
    </div>
  );
}

function OverviewPanel({ systemState }) {
  if (!systemState) return <div>No system state available</div>;

  const uptime = systemState.uptime
    ? Math.floor(systemState.uptime / 1000 / 60)
    : 0;

  return (
    <div className="overview-panel">
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Operations</h4>
          <div className="metric-value">
            {systemState.metrics?.operationsCount || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>Errors</h4>
          <div className="metric-value error">
            {systemState.metrics?.errorsCount || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>Warnings</h4>
          <div className="metric-value warning">
            {systemState.metrics?.warningsCount || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>Audit Events</h4>
          <div className="metric-value">
            {systemState.metrics?.auditEventsCount || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>Uptime</h4>
          <div className="metric-value">{uptime}m</div>
        </div>

        <div className="metric-card">
          <h4>Started</h4>
          <div className="metric-value">
            {systemState.startupTime
              ? new Date(systemState.startupTime).toLocaleString()
              : 'Unknown'}
          </div>
        </div>
      </div>

      <div className="flags-section">
        <h4>System Flags</h4>
        <div className="flags-grid">
          <div
            className={`flag ${systemState.flags?.safetyEnabled ? 'enabled' : 'disabled'}`}
          >
            <span className="flag-icon">🛡️</span>
            <span className="flag-label">Safety System</span>
            <span className="flag-status">
              {systemState.flags?.safetyEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div
            className={`flag ${systemState.flags?.privacyEnabled ? 'enabled' : 'disabled'}`}
          >
            <span className="flag-icon">🔒</span>
            <span className="flag-label">Privacy Manager</span>
            <span className="flag-status">
              {systemState.flags?.privacyEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div
            className={`flag ${systemState.flags?.auditEnabled ? 'enabled' : 'disabled'}`}
          >
            <span className="flag-icon">📋</span>
            <span className="flag-label">Audit Logger</span>
            <span className="flag-status">
              {systemState.flags?.auditEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div
            className={`flag ${systemState.flags?.debugEnabled ? 'enabled' : 'disabled'}`}
          >
            <span className="flag-icon">🐛</span>
            <span className="flag-label">Debug Mode</span>
            <span className="flag-status">
              {systemState.flags?.debugEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubsystemsPanel({ systemState }) {
  if (!systemState?.subsystems) return <div>No subsystem data available</div>;

  return (
    <div className="subsystems-panel">
      <div className="subsystems-grid">
        {Object.entries(systemState.subsystems).map(([name, subsystem]) => (
          <div key={name} className="subsystem-card">
            <div className="subsystem-header">
              <h4>{name}</h4>
              <span
                className={`subsystem-status status-${subsystem.initialized ? 'active' : 'inactive'}`}
              >
                {subsystem.initialized ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="subsystem-details">
              <p>
                <strong>Status:</strong> {subsystem.status}
              </p>
              <p>
                <strong>Initialized:</strong>{' '}
                {subsystem.initialized ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogPanel({ auditLogs }) {
  return (
    <div className="audit-log-panel">
      <div className="audit-log-header">
        <h4>Recent Audit Events</h4>
        <p>Showing last {auditLogs.length} events</p>
      </div>

      <div className="audit-log-list">
        {auditLogs.length === 0 ? (
          <div className="empty-state">No audit events available</div>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} className={`audit-log-entry level-${log.level}`}>
              <div className="log-header">
                <span className="log-category">{log.category}</span>
                <span className="log-event">{log.event}</span>
                <span className="log-timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              {log.data && Object.keys(log.data).length > 0 && (
                <div className="log-data">
                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DebugPanel({ debugInfo }) {
  if (!debugInfo) return <div>No debug information available</div>;

  return (
    <div className="debug-panel">
      <div className="debug-section">
        <h4>Debug Information</h4>
        <pre className="debug-output">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
}
