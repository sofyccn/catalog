import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { KyodoLogo } from './KyodoLogo'

/** Minimal header for the internal (dispatcher/admin) panel — no cart. */
export function WorkerHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250, 250, 245, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px' }}>
        {/* Logo → root, redirected to the user's panel home (admin or dispatcher). */}
        <Link to="/" style={{ display: 'inline-flex' }} title="Volver al panel">
          <KyodoLogo size={42} tagline />
        </Link>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'var(--green-tint)',
            color: 'var(--green)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Panel interno
        </span>
        <div style={{ flex: 1 }} />
        <Link
          to="/perfil"
          style={{ padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          Mi perfil
        </Link>
        <UserButton />
      </div>
    </header>
  )
}

export const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  DRAFT: { label: 'Borrador', bg: 'var(--bg-tint)', color: 'var(--ink-faint)' },
  SENT: { label: 'Nuevo', bg: 'var(--blue-tint)', color: 'var(--blue)' },
  IN_REVIEW: { label: 'En revisión', bg: 'var(--amber-tint)', color: 'var(--amber)' },
  REVIEWED: { label: 'Proforma enviada', bg: 'var(--amber-tint)', color: 'var(--amber)' },
  APPROVED: { label: 'Aprobado', bg: 'var(--ok-tint)', color: 'var(--ok)' },
  REJECTED: { label: 'Rechazado', bg: 'var(--red-tint)', color: 'var(--red)' },
  CANCELLED: { label: 'Cancelado', bg: 'var(--bg-tint)', color: 'var(--ink-faint)' },
}

export function StatusTag({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT!
  return (
    <span className="tag" style={{ background: m.bg, color: m.color, width: 'fit-content' }}>
      {m.label}
    </span>
  )
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
