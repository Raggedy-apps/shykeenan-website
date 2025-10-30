import { useEffect, useState } from 'react';
import { useAdmin } from '../context/SecureAdminContext.jsx';

export default function SecureAdminGate({ children }) {
  const { isAuthenticated, login, logout, csrfToken, generateCSRFToken } =
    useAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Generate CSRF token on component mount
  useEffect(() => {
    if (!csrfToken) {
      generateCSRFToken();
    }
  }, [csrfToken, generateCSRFToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(password);
      if (success) {
        setPassword('');
        setShowPassword(false);
      } else {
        setError(
          'Authentication failed. Please check your credentials and try again.'
        );
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <section className="secure-admin-gate" aria-live="polite">
        <div className="admin-gate-card">
          <h2>Secure Administrator Access</h2>
          <p>Enter your credentials to access administrative functions.</p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="password-input-group">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(sanitizeText(event.target.value))}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  placeholder="Enter administrator password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="security-info">
            <small>
              🔒 All sessions are encrypted and time-limited for security.
              <br />
              Multiple failed attempts will temporarily lock access.
            </small>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-session-active">
      <div className="admin-header">
        <div className="session-info">
          <span
            className="status-indicator active"
            aria-label="Authenticated"
          ></span>
          <span>Administrator access active</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="logout-button"
          aria-label="End administrator session"
        >
          Sign Out
        </button>
      </div>

      <div className="admin-content">{children}</div>
    </div>
  );
}
