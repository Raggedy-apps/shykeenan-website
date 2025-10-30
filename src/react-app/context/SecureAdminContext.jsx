import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';

// Create context
const SecureAdminContext = createContext({
  isAuthenticated: false,
  csrfToken: null,
  sessionInfo: null,
  login: async () => false,
  logout: () => {},
  generateCSRFToken: () => {},
  validateCSRFToken: () => false,
});

export function SecureAdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    // Check if window.auth is available (from auth.js)
    if (typeof window !== 'undefined' && window.auth) {
      const authenticated = window.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setCsrfToken(window.auth.getCSRFToken());
      setSessionInfo(window.auth.getSessionInfo());
    }
  }, []);

  // Login function
  const login = useCallback(async (password) => {
    if (!password || typeof window === 'undefined' || !window.auth) {
      return false;
    }

    try {
      const success = await window.auth.createSession(password);
      if (success) {
        setIsAuthenticated(true);
        setCsrfToken(window.auth.getCSRFToken());
        setSessionInfo(window.auth.getSessionInfo());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    if (typeof window !== 'undefined' && window.auth) {
      window.auth.logout();
    }
    setIsAuthenticated(false);
    setCsrfToken(null);
    setSessionInfo(null);
  }, []);

  // Generate new CSRF token
  const generateCSRFToken = useCallback(() => {
    if (typeof window !== 'undefined' && window.auth) {
      const token = window.auth.generateCSRFToken();
      setCsrfToken(token);
      return token;
    }
    return null;
  }, []);

  // Validate CSRF token
  const validateCSRFToken = useCallback((token) => {
    if (typeof window !== 'undefined' && window.auth) {
      return window.auth.validateCSRFToken(token);
    }
    return false;
  }, []);

  // Update session info
  const updateSessionInfo = useCallback(() => {
    if (typeof window !== 'undefined' && window.auth) {
      setSessionInfo(window.auth.getSessionInfo());
    }
  }, []);

  // Setup activity monitoring
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined' || !window.auth)
      return;

    const handleActivity = () => {
      window.auth.updateLastActivity();
      updateSessionInfo();
    };

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];
    events.forEach((event) =>
      document.addEventListener(event, handleActivity, true)
    );

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity, true)
      );
    };
  }, [isAuthenticated, updateSessionInfo]);

  // Auto-logout on session expiry
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      if (typeof window !== 'undefined' && window.auth) {
        const stillValid = window.auth.isAuthenticated();
        if (!stillValid && isAuthenticated) {
          setIsAuthenticated(false);
          setCsrfToken(null);
          setSessionInfo(null);
          // Force page reload to clear any sensitive state
          window.location.reload();
        }
      }
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      csrfToken,
      sessionInfo,
      login,
      logout,
      generateCSRFToken,
      validateCSRFToken,
    }),
    [
      isAuthenticated,
      csrfToken,
      sessionInfo,
      login,
      logout,
      generateCSRFToken,
      validateCSRFToken,
    ]
  );

  return (
    <SecureAdminContext.Provider value={value}>
      {children}
    </SecureAdminContext.Provider>
  );
}

export function useSecureAdmin() {
  const context = useContext(SecureAdminContext);
  if (!context) {
    throw new Error('useSecureAdmin must be used within a SecureAdminProvider');
  }
  return context;
}
