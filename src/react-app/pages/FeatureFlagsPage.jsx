import { useState } from 'react';
import { ROLES } from '../../js/authorization.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useFeatureFlags } from '../context/FeatureFlagContext.jsx';

const DEFAULT_FLAGS = {
  experimentalUI: false,
  enableAuditLog: false,
  betaAccess: false,
};

const FLAG_DESCRIPTIONS = {
  experimentalUI: 'Enable experimental UI features',
  enableAuditLog: 'Enable audit logging for admin actions',
  betaAccess: 'Allow beta access for selected users',
};

const FLAG_ROLES = {
  experimentalUI: [ROLES.SUPERUSER, ROLES.DEV],
  enableAuditLog: [ROLES.SUPERUSER, ROLES.ADMIN],
  betaAccess: [ROLES.SUPERUSER, ROLES.ADMIN, ROLES.DEV],
};

function getPersistedFlags() {
  try {
    const raw = localStorage.getItem('featureFlags');
    return raw ? JSON.parse(raw) : { ...DEFAULT_FLAGS };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

function persistFlags(flags) {
  try {
    localStorage.setItem('featureFlags', JSON.stringify(flags));
  } catch {}
}

export default function FeatureFlagsPage() {
  const { flags, setFlag, canManageFlags } = useFeatureFlags();
  const { currentRole } = useAdmin();
  const [localFlags, setLocalFlags] = useState(() => ({ ...getPersistedFlags(), ...flags }));
  const [log, setLog] = useState([]);

  const handleToggle = flag => {
    if (!canManageFlags) return;
    const updated = { ...localFlags, [flag]: !localFlags[flag] };
    setLocalFlags(updated);
    setFlag(flag, updated[flag]);
    persistFlags(updated);
    setLog(prev => [
      { flag, value: updated[flag], user: currentRole, ts: new Date().toISOString() },
      ...prev,
    ]);
  };

  const handleReset = () => {
    setLocalFlags({ ...DEFAULT_FLAGS });
    Object.keys(DEFAULT_FLAGS).forEach(flag => setFlag(flag, DEFAULT_FLAGS[flag]));
    persistFlags(DEFAULT_FLAGS);
    setLog(prev => [
      { flag: 'ALL', value: 'reset', user: currentRole, ts: new Date().toISOString() },
      ...prev,
    ]);
  };

  return (
    <section className="react-admin-card" aria-labelledby="feature-flags-heading">
      <h2 id="feature-flags-heading">Feature Flag Management</h2>
      <table className="feature-flag-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Allowed Roles</th>
            <th>Status</th>
            {canManageFlags && <th>Toggle</th>}
          </tr>
        </thead>
        <tbody>
          {Object.keys(DEFAULT_FLAGS).map(flag => (
            <tr key={flag}>
              <td>{flag}</td>
              <td>{FLAG_DESCRIPTIONS[flag]}</td>
              <td>{FLAG_ROLES[flag].join(', ')}</td>
              <td>{localFlags[flag] ? 'Enabled' : 'Disabled'}</td>
              {canManageFlags && (
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggle(flag)}
                    disabled={!FLAG_ROLES[flag].includes(currentRole)}
                    aria-pressed={!!localFlags[flag]}
                  >
                    {localFlags[flag] ? 'Disable' : 'Enable'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {canManageFlags && (
        <button type="button" onClick={handleReset} style={{ marginTop: 16 }}>
          Reset All Flags
        </button>
      )}
      <h3>Audit Log</h3>
      <ul className="feature-flag-log" aria-live="polite">
        {log.length === 0 && <li>No recent actions.</li>}
        {log.map((entry, idx) => (
          <li key={idx}>
            [{entry.ts}] <strong>{entry.user}</strong> set <code>{entry.flag}</code> to{' '}
            <strong>{String(entry.value)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
