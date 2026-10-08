import { useClerk } from '@clerk/react'
import { Ban, LogOut } from 'lucide-react'

/** Shown for REJECTED/inactive accounts, and (with `message`) when the
 *  account couldn't be loaded at all, which is an error, not a ban. */
export default function Rejected({ message }: { message?: string }) {
  const { signOut } = useClerk()
  const isError = Boolean(message)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 28, textAlign: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--red-tint)',
            color: 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ban size={24} />
        </div>
        <h1 style={{ fontSize: 24 }}>{isError ? 'No pudimos cargar tu cuenta' : 'Acceso no autorizado'}</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
          {message ?? 'Tu cuenta no tiene acceso al catálogo. Si crees que es un error, contacta a Importadora Cobo.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          {isError && (
            <button type="button" onClick={() => window.location.reload()} className="btn primary">
              Intentar de nuevo
            </button>
          )}
          <button type="button" onClick={() => signOut({ redirectUrl: '/login' })} className="btn ghost">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
