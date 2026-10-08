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
