import { createContext, useContext, useMemo, useState } from 'react';
import { PERMISSIONS } from '../../js/authorization.js';
import { useAdmin } from './AdminContext.jsx';

const FeatureFlagContext = createContext({
  flags: {},
  setFlag: () => {},
  canManageFlags: false,
});

export function FeatureFlagProvider({ children, initialFlags = {} }) {
  const [flags, setFlags] = useState(initialFlags);
  const { hasPermission } = useAdmin();
  const canManageFlags = hasPermission(PERMISSIONS.MANAGE_FEATURE_FLAGS);

  const setFlag = (flag, value) => {
    if (!canManageFlags) return;
    setFlags(prev => ({ ...prev, [flag]: value }));
  };

  const value = useMemo(() => ({ flags, setFlag, canManageFlags }), [flags, canManageFlags]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
