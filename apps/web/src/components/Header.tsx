import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { ShoppingCart } from 'lucide-react'
import { KyodoLogo } from './KyodoLogo'
import { cartCount, useCart } from '../stores/cart'

/** Catalog shell header — logo + nav + cart + Clerk user menu (design-styled). */
export function Header() {
  const { pathname } = useLocation()
  const count = useCart((s) => cartCount(s.lines))

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
        {/* Logo → root, redirected to the user's panel home (clients land back on the catalog, admins on /admin). */}
        <Link to="/" style={{ display: 'inline-flex' }} title="Volver al inicio">
          <KyodoLogo size={42} tagline />
        </Link>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <NavPill to="/catalogo" active={pathname.startsWith('/catalogo') || pathname.startsWith('/producto')}>
            Catálogo
          </NavPill>
          <NavPill to="/pedido" active={pathname.startsWith('/pedido')}>
            Mi pedido
          </NavPill>
          <NavPill to="/perfil" active={pathname.startsWith('/perfil')}>
            Mi perfil
          </NavPill>
        </nav>
        <div style={{ flex: 1 }} />
        <Link
          to="/carrito"
          className="btn ghost"
          style={{ position: 'relative', padding: '8px 14px', borderRadius: 999 }}
          aria-label="Carrito"
        >
          <ShoppingCart size={18} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Carrito</span>
          {count > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                background: 'var(--amber-bright)',
                color: 'var(--ink)',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                border: '2px solid var(--bg)',
              }}
            >
              {count}
            </span>
          )}
        </Link>
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
