import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { roleHome } from '../lib/roles'

/** Sends an authenticated user from "/" to their role's home route. */
export function RoleRedirect() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={roleHome[user.role]} replace />
}
