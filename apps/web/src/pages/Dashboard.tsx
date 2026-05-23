import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/auth'
import { roleLabel } from '../lib/roles'

/**
 * Week-1 placeholder landing page. Confirms the logged-in user and role, and
 * provides logout. Replaced by the real role-specific screens in later weeks.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-slate-900">Catálogo Cobo</span>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Bienvenido</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{user?.fullName}</h1>
          <p className="mt-4 text-slate-600">
            Has iniciado sesión como{' '}
            <span className="font-medium text-slate-900">
              {user ? roleLabel[user.role] : ''}
            </span>
            . Aquí irá tu panel cuando construyamos las pantallas de cada rol.
          </p>
        </div>
      </main>
    </div>
  )
}
