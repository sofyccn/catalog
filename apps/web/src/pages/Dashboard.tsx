import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { ClipboardList, Inbox, Package } from 'lucide-react'
import { useMe } from '../api/me'
import { roleLabel } from '../lib/roles'

/**
 * Week-1 placeholder landing page. Confirms the active user + role and provides
 * logout (Clerk's UserButton). Replaced by role-specific screens later.
 */
export default function Dashboard() {
  const me = useMe()
  const user = me.data

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-slate-900">Catálogo Cobo</span>
        <div className="flex items-center gap-4">
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin/catalogo" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <Package className="h-4 w-4" />
                Catálogo
              </Link>
              <Link to="/despacho" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <Inbox className="h-4 w-4" />
                Pedidos
              </Link>
              <Link to="/admin/solicitudes" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <ClipboardList className="h-4 w-4" />
                Solicitudes
              </Link>
            </>
          )}
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Bienvenido</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{user?.fullName}</h1>
          <p className="mt-4 text-slate-600">
            Has iniciado sesión como{' '}
            <span className="font-medium text-slate-900">
              {user?.role ? roleLabel[user.role] : ''}
            </span>
            . Aquí irá tu panel cuando construyamos las pantallas de cada rol.
          </p>
        </div>
      </main>
    </div>
  )
}
