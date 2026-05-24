import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { useMe } from '../api/me'
import { FullScreenSpinner } from './Spinner'
import Pending from '../pages/Pending'
import Rejected from '../pages/Rejected'

/**
 * Gate for the whole authenticated area:
 *   not signed in        → /login
 *   loading              → spinner
 *   status PENDING       → waiting screen
 *   status REJECTED/etc. → no-access screen
 *   status ACTIVE        → render the app (Outlet)
 */
export function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const me = useMe()

  if (!isLoaded) return <FullScreenSpinner />
  if (!isSignedIn) return <Navigate to="/login" replace />
  if (me.isLoading) return <FullScreenSpinner />
  if (me.isError || !me.data) {
    return <Rejected message="No se pudo cargar tu cuenta. Intenta de nuevo más tarde." />
  }

  if (me.data.status === 'PENDING') return <Pending />
  if (me.data.status !== 'ACTIVE') return <Rejected />

  return <Outlet />
}
