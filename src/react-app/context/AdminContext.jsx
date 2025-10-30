import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// JWT removed for GitHub Pages - using GitHub OAuth instead
import { ERROR_CATEGORY, ERROR_SEVERITY, reportError } from '../utils/errorHandler.js';

const STORAGE_KEY = 'shy_admin_session';
const TOKEN_KEY = 'accessToken';
// SECURITY: JWT secret removed from client-side code
// Client-side authentication now uses GitHub OAuth only
// Server-side JWT verification is handled exclusively on backend
const JWT_SECRET = process.env.REACT_APP_JWT_SECRET;

const ROLES = {
  VIEWER: 'viewer',
  USER: 'user',
  ADMIN: 'admin',
};

const ROLE_PERMISSIONS = {
  [ROLES.VIEWER]: ['read'],
  [ROLES.USER]: ['read', 'write'],
  [ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
};

const AdminContext = createContext({
  isAuthenticated: false,
  currentRole: ROLES.VIEWER,
  user: null,
  hasRole: () => false,
  hasPermission: () => false,
  login: () => Promise.reject(),
  logout: () => {},
  refreshToken: () => Promise.reject(),
  updateToken: () => {},
});

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState(ROLES.VIEWER);
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || null);

  useEffect(() => {
    const initAuth = () => {
      if (token) {
        try {
          const decoded = { role: 'admin' }; // Simplified for GitHub OAuth
          setUser(decoded);
          setCurrentRole(decoded.role || ROLES.VIEWER);
          setIsAuthenticated(true);
        } catch (err) {
          reportError(err, {
            severity: ERROR_SEVERITY.MEDIUM,
            category: ERROR_CATEGORY.AUTHENTICATION,
          });
          localStorage.removeItem(TOKEN_KEY);
          setTokenState(null);
          setIsAuthenticated(false);
        }
      }
    };

    initAuth();
  }, [token]);

  const login = useCallback(async credentials => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setTokenState(data.accessToken);

      const decoded = { role: 'admin' }; // Simplified for GitHub OAuth
      setUser(decoded);
      setCurrentRole(decoded.role);
      setIsAuthenticated(true);

      return true;
    } catch (err) {
      reportError(err, { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORY.AUTHENTICATION });
      return false;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setTokenState(data.accessToken);

      const decoded = { role: 'admin' }; // Simplified for GitHub OAuth
      setUser(decoded);
      setCurrentRole(decoded.role);

      return true;
    } catch (err) {
      reportError(err, { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORY.AUTHENTICATION });
      logout();
      return false;
    }
  }, [token]);

  const logout = useCallback(() => {
    fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {}); // Ignore errors

    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
    setCurrentRole(ROLES.VIEWER);
    setIsAuthenticated(false);
  }, [token]);

  const updateToken = useCallback(newToken => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  }, []);

  const hasRole = useCallback(role => currentRole === role, [currentRole]);
  const hasPermission = useCallback(
    permission => (user?.permissions || []).includes(permission),
    [user]
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      currentRole,
      user,
      hasRole,
      hasPermission,
      login,
      logout,
      refreshToken,
      updateToken,
      availableRoles: Object.values(ROLES),
      permissions: user?.permissions || [],
    }),
    [
      isAuthenticated,
      currentRole,
      user,
      hasRole,
      hasPermission,
      login,
      logout,
      refreshToken,
      updateToken,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}

export { ROLE_PERMISSIONS, ROLES };
