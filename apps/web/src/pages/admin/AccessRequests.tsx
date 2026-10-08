import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Check, Loader2, MapPin, Phone, User, X } from 'lucide-react'
import { WorkerHeader } from '../../components/WorkerHeader'
import { usePendingUsers, useApproveUser, useRejectUser } from '../../api/users'
import { getApiErrorMessage } from '../../lib/api'
import { roleLabel } from '../../lib/roles'
import type { Me, Role } from '../../types/auth'

const ROLES: Role[] = ['CLIENT', 'DISPATCHER', 'ADMIN']

export default function AccessRequests() {
  const pending = usePendingUsers()
  const approve = useApproveUser()
  const reject = useRejectUser()
  // Per-row role selection (defaults to CLIENT).
  const [roleByUser, setRoleByUser] = useState<Record<string, Role>>({})
  const users = pending.data ?? []
  const error = approve.error ?? reject.error

  const onReject = (u: Me) => {
    if (!window.confirm(`¿Rechazar la solicitud de ${u.fullName} (${u.email})? No podrá entrar al catálogo.`)) return
    reject.mutate(u.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <WorkerHeader />
      <main className="fade-up">
        <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
          <div className="container" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px 16px', flexWrap: 'wrap' }}>
            <Link to="/admin" className="btn ghost">
              <ArrowLeft size={16} /> Volver al panel
            </Link>
            <div style={{ flex: 1 }}>
              <span className="label">Administración</span>
              <h1 style={{ fontSize: 28, marginTop: 2 }}>Solicitudes de acceso</h1>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '24px 24px 64px', maxWidth: 820 }}>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: 14, marginBottom: 12 }}>{getApiErrorMessage(error)}</p>
          )}

          {pending.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
            </div>
          ) : users.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>No hay solicitudes pendientes</h2>
              <p className="muted" style={{ fontSize: 14 }}>Cuando alguien se registre, aparecerá aquí para que lo apruebes.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {users.map((u) => {
                const selectedRole = roleByUser[u.id] ?? 'CLIENT'
                const busy =
                  (approve.isPending && approve.variables?.id === u.id) ||
                  (reject.isPending && reject.variables === u.id)
                return (
                  <div key={u.id} className="access-row">
                    <div className="access-row__person">
                      <div className="access-row__avatar">
                        {u.photoUrl ? <img src={u.photoUrl} alt="" /> : <User size={22} color="var(--ink-faint)" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                        <div className="muted" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{u.email}</div>
                        <div className="access-row__details">
                          {u.phone && <span><Phone size={12} />{u.phone}</span>}
                          {u.city && <span><MapPin size={12} />{u.city}</span>}
                          {u.company && <span><Building2 size={12} />{u.company}</span>}
                          {!u.phone && !u.city && !u.company && <span className="faint">Perfil sin completar</span>}
                        </div>
                      </div>
                    </div>

                    <div className="access-row__actions">
                      <select
                        className="input"
                        value={selectedRole}
                        disabled={busy}
                        onChange={(e) => setRoleByUser((prev) => ({ ...prev, [u.id]: e.target.value as Role }))}
                        aria-label="Rol"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{roleLabel[r]}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve.mutate({ id: u.id, role: selectedRole })}
                        className="btn primary sm"
                      >
                        <Check size={14} /> Aprobar
                      </button>
                      <button type="button" disabled={busy} onClick={() => onReject(u)} className="btn ghost sm">
                        <X size={14} /> Rechazar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
