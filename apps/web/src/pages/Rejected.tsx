import { useClerk } from '@clerk/react'
import { Ban, LogOut } from 'lucide-react'

export default function Rejected({ message }: { message?: string }) {
  const { signOut } = useClerk()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Ban className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-slate-600">
          {message ?? 'Tu cuenta no tiene acceso al catálogo. Contacta al administrador si crees que es un error.'}
        </p>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/login' })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
