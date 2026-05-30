import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { ShoppingCart } from 'lucide-react'
import { KyodoLogo } from './KyodoLogo'
import { cartCount, useCart } from '../stores/cart'

/** Catalog shell header — logo + nav + cart + Clerk user menu.
 *  On phones the nav pills wrap to a second row so the top stays tidy. */
export function Header() {
  const { pathname } = useLocation()
  const count = useCart((s) => cartCount(s.lines))

  return (
    <header className="app-header">
      <div className="app-header__row">
        <Link to="/" className="app-header__logo" title="Volver al inicio">
          <KyodoLogo size={42} tagline />
        </Link>
        <nav className="app-header__nav">
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
        <div className="app-header__spacer" />
        <Link to="/carrito" className="btn ghost app-header__cart" aria-label="Carrito">
          <ShoppingCart size={18} />
          <span className="app-header__cart-label">Carrito</span>
          {count > 0 && <span className="app-header__cart-badge">{count}</span>}
        </Link>
        <UserButton />
      </div>
    </header>
  )
}

function NavPill({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} className={`app-header__pill ${active ? 'is-active' : ''}`}>
      {children}
    </Link>
  )
}
