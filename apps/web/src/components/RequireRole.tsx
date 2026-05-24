import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../api/me'
import { FullScreenSpinner } from './Spinner'
import type { Role } from '../types/auth'

/** Gates nested routes to the given roles. Use inside AppLayout (active users). */
export function RequireRole({ roles }: { roles: Role[] }) {
  const me = useMe()
  if (me.isLoading) return <FullScreenSpinner />
  const role = me.data?.role
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />
  return <Outlet />
}
