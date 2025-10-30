import { useAdmin } from '../context/AdminContext.jsx';

export default function PermissionGate({ permission, children, fallback = null, 'aria-label': ariaLabel = 'Permission-restricted content' }) {
  const { hasPermission } = useAdmin();
  
  if (hasPermission(permission)) {
    return (
      <section role="group" aria-label={ariaLabel}>
        {children}
      </section>
    );
  }
  
  return fallback ? (
    <div role="alert" aria-label="Access denied due to insufficient permissions">
      {fallback}
    </div>
  ) : null;
}
