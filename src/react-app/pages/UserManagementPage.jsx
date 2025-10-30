import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useA11yAnnounce } from '../hooks/useA11yAnnounce.js';
import { ERROR_CATEGORY, ERROR_SEVERITY, reportError } from '../utils/errorHandler.js';

const UserManagementPage = () => {
  const { isAuthenticated, currentRole, hasPermission } = useAdmin();
  const { announcementRef, announce } = useA11yAnnounce();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && hasPermission('read')) {
      fetchUsers();
    }
  }, [isAuthenticated, hasPermission]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      announce('Users loaded successfully');
      setError(null);
    } catch (err) {
      reportError(err, { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORY.NETWORK });
      setError('Failed to fetch users');
      announce('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!hasPermission('write')) {
      setError('Insufficient permissions');
      announce('Insufficient permissions to create user');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers([...users, data.user]);
      setNewUser({ email: '', password: '', role: 'user' });
      setError(null);
      announce('User created successfully');
    } catch (err) {
      reportError(err, { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORY.BUSINESS_LOGIC });
      setError('Failed to create user');
      announce('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!hasPermission('delete')) {
      setError('Insufficient permissions');
      announce('Insufficient permissions to delete user');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setUsers(users.filter(user => user.id !== userId));
      setError(null);
      announce('User deleted successfully');
    } catch (err) {
      reportError(err, { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORY.BUSINESS_LOGIC });
      setError('Failed to delete user');
      announce('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || currentRole !== 'admin') {
    return (
      <main id="main-content">
        <a href="#main-content" className="skip-link visually-hidden">Skip to main content</a>
        <section aria-label="Access Denied">
          <h1>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link visually-hidden">Skip to main content</a>
      <main id="main-content" className="user-management">
        <header>
          <h1>User Management</h1>
        </header>

        <div ref={announcementRef} role="status" aria-live="polite" className="visually-hidden">
          {/* Announcements will be inserted here by the hook */}
        </div>

        {error && (
          <div role="alert" className="react-admin-error">
            {error}
          </div>
        )}

        <section aria-labelledby="create-user-heading">
          <h2 id="create-user-heading">Create New User</h2>
          <form onSubmit={handleCreateUser} aria-describedby={error ? "form-error" : undefined}>
            {error && (
              <div id="form-error" className="react-admin-error" role="alert">
                {error}
              </div>
            )}
            <div className="react-admin-form-group">
              <label htmlFor="user-email">Email</label>
              <input
                id="user-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: sanitizeText(e.target.value) })}
                required
                aria-describedby={error ? "form-error" : undefined}
              />
            </div>
            <div className="react-admin-form-group">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: sanitizeText(e.target.value) })}
                required
                aria-describedby={error ? "form-error" : undefined}
              />
            </div>
            <div className="react-admin-form-group">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                aria-describedby={error ? "form-error" : undefined}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} role="button">
              Create User
            </button>
          </form>
        </section>

        <section aria-labelledby="users-list-heading">
          <h2 id="users-list-heading">Users List</h2>
          {loading ? (
            <div className="page-loader" role="status" aria-label="Loading users">
              <div>Loading...</div>
            </div>
          ) : (
            <ul role="list" aria-label="List of users">
              {users.map(user => (
                <li key={user.id} role="listitem">
                  <span>{user.email} ({user.role})</span>
                  {hasPermission('delete') && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      role="button"
                      aria-label={`Delete user ${user.email}`}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
};

export default UserManagementPage;