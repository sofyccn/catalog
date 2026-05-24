import { Navigate, Route, Routes } from 'react-router-dom'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import AccessRequests from './pages/admin/AccessRequests'
import { AppLayout } from './components/AppLayout'
import { RequireRole } from './components/RequireRole'
import { RoleRedirect } from './components/RoleRedirect'

export default function App() {
  return (
    <Routes>
      {/* Clerk sign-in / sign-up (path routing needs the splat) */}
      <Route path="/login/*" element={<SignInPage />} />
      <Route path="/registro/*" element={<SignUpPage />} />

      {/* Authenticated area — AppLayout enforces signed-in + ACTIVE status */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<RoleRedirect />} />

        <Route element={<RequireRole roles={['ADMIN']} />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/solicitudes" element={<AccessRequests />} />
        </Route>
        <Route element={<RequireRole roles={['DISPATCHER']} />}>
          <Route path="/despacho" element={<Dashboard />} />
        </Route>
        <Route element={<RequireRole roles={['CLIENT', 'ADMIN']} />}>
          <Route path="/catalogo" element={<Catalog />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
