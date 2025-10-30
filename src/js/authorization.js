// Minimal permissions map for client-side checks
// Must align with AdminContext ROLE_PERMISSIONS in ../react-app/context/AdminContext.jsx
export const PERMISSIONS = {
  READ: 'read',
  EDIT_POST: 'write',
  DELETE_POST: 'delete',
  ADMIN: 'admin',
};
