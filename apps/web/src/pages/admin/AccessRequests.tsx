import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import { usePendingUsers, useApproveUser, useRejectUser } from '../../api/users'
import { roleLabel } from '../../lib/roles'
import type { Role } from '../../types/auth'

const ROLES: Role[] = ['CLIENT', 'DISPATCHER', 'ADMIN']

export default function AccessRequests() {
  const pending = usePendingUsers()
  const approve = useApproveUser()
  const reject = useRejectUser()
  // Per-row role selection (defaults to CLIENT).
  const [roleByUser, setRoleByUser] = useState<Record<string, Role>>({})

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link to="/admin" className="text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Solicitudes de acceso</h1>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {pending.isLoading && (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {pending.data && pending.data.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
            No hay solicitudes pendientes.
          </p>
        )}

        <ul className="space-y-3">
          {pending.data?.map((u) => {
            const selectedRole = roleByUser[u.id] ?? 'CLIENT'
            const busy =
              (approve.isPending && approve.variables?.id === u.id) ||
              (reject.isPending && reject.variables === u.id)
            return (
              <li
                key={u.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{u.fullName}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    disabled={busy}
                    onChange={(e) =>
                      setRoleByUser((prev) => ({ ...prev, [u.id]: e.target.value as Role }))
                    }
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel[r]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => approve.mutate({ id: u.id, role: selectedRole })}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reject.mutate(u.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
