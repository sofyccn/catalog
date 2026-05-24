import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { KyodoLogo } from './KyodoLogo'

/** Catalog shell header — logo + nav + Clerk user menu (design-styled). */
export function Header() {
  const { pathname } = useLocation()
  const onCatalog = pathname.startsWith('/catalogo')

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
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 24px' }}>
        <Link to="/catalogo" style={{ display: 'inline-flex' }}>
          <KyodoLogo size={42} tagline />
        </Link>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <NavPill to="/catalogo" active={onCatalog}>
            Catálogo
          </NavPill>
          <span
            title="Próximamente"
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-faint)',
              cursor: 'not-allowed',
            }}
          >
            Mi pedido
          </span>
        </nav>
        <div style={{ flex: 1 }} />
        <UserButton />
      </div>
    </header>
  )
}

function NavPill({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        color: active ? 'var(--ink)' : 'var(--ink-soft)',
        background: active ? 'var(--bg-tint)' : 'transparent',
      }}
    >
      {children}
    </Link>
  )
}
