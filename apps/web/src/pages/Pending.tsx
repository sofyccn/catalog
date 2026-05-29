import { useClerk } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { KyodoLogo } from '../components/KyodoLogo'
import { ProfileForm } from '../components/ProfileForm'

export default function Pending() {
  const { signOut } = useClerk()
  const qc = useQueryClient()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Minimal header */}
      <header style={{ borderBottom: '1px solid var(--line)', background: 'rgba(250,250,245,0.92)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
          <KyodoLogo size={42} tagline />
          <button
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="btn ghost sm"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="fade-up container" style={{ padding: '32px 24px 64px', maxWidth: 560 }}>
        {/* Status card */}
        <div className="card" style={{ padding: 24 }}>
          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--amber-tint)',
                color: 'var(--amber)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, marginBottom: 4 }}>Cuenta pendiente de aprobación</h1>
              <p className="muted" style={{ fontSize: 14 }}>
                Tu registro fue recibido. Mientras un administrador aprueba tu acceso, completa tu
                perfil con tu información de contacto.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ['me'] })}
              className="btn ghost sm"
            >
              <RefreshCw size={14} /> Volver a comprobar
            </button>
          </div>
        </div>

        {/* Profile form — info that helps the admin decide */}
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Completa tu perfil</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            El administrador verá esta información al revisar tu solicitud.
          </p>
          <ProfileForm />
        </div>
      </main>
    </div>
  )
}
