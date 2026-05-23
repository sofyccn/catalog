import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRedirect } from './components/RoleRedirect'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Any authenticated user: send "/" to their role home */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleRedirect />} />
      </Route>

      {/* Role-gated areas (placeholder dashboards for now) */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<Dashboard />} />
      </Route>
      <Route element={<ProtectedRoute roles={['DISPATCHER']} />}>
        <Route path="/despacho" element={<Dashboard />} />
      </Route>
      <Route element={<ProtectedRoute roles={['CLIENT']} />}>
        <Route path="/catalogo" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
