import { Navigate } from 'react-router-dom'
import { useMe } from '../api/me'
import { FullScreenSpinner } from './Spinner'
import { roleHome } from '../lib/roles'

/** Sends an active user from "/" to their role's home route. */
export function RoleRedirect() {
  const me = useMe()
  if (me.isLoading) return <FullScreenSpinner />
  const role = me.data?.role
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={roleHome[role]} replace />
}
