import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { KyodoLogo } from './KyodoLogo'

/** Minimal header for the internal (dispatcher/admin) panel — no cart. */
export function WorkerHeader() {
  return (
    <header className="app-header">
      <div className="app-header__row">
        <Link to="/" className="app-header__logo" title="Volver al panel">
          <KyodoLogo size={42} tagline />
        </Link>
        <span className="app-header__badge">Panel interno</span>
        <div className="app-header__spacer" />
        <Link to="/perfil" className="app-header__profile">
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
