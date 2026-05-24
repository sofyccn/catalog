import { useClerk } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

export default function Pending() {
  const { signOut } = useClerk()
  const qc = useQueryClient()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Cuenta pendiente de aprobación</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu registro fue recibido. Un administrador debe aprobar tu acceso antes de que puedas
          usar el catálogo. Te avisaremos cuando esté listo.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => qc.invalidateQueries({ queryKey: ['me'] })}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Volver a comprobar
          </button>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
