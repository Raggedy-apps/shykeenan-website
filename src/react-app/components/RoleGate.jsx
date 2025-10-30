import { useAdmin } from '../context/AdminContext.jsx';

export default function RoleGate({ role, children, fallback = null, 'aria-label': ariaLabel = 'Role-restricted content' }) {
  const { hasRole } = useAdmin();
  
  if (hasRole(role)) {
    return (
      <section role="group" aria-label={ariaLabel}>
        {children}
      </section>
    );
  }
  
  return fallback ? (
    <div role="alert" aria-label="Access denied due to insufficient role">
      {fallback}
    </div>
  ) : null;
}
