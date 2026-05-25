import { Navigate, Route, Routes } from 'react-router-dom'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import MyOrder from './pages/MyOrder'
import DispatcherInbox from './pages/dispatcher/Inbox'
import DispatcherOrderReview from './pages/dispatcher/OrderReview'
import AccessRequests from './pages/admin/AccessRequests'
import CatalogManager from './pages/admin/CatalogManager'
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
          <Route path="/admin/catalogo" element={<CatalogManager />} />
        </Route>
        <Route element={<RequireRole roles={['DISPATCHER', 'ADMIN']} />}>
          <Route path="/despacho" element={<DispatcherInbox />} />
          <Route path="/despacho/pedido/:id" element={<DispatcherOrderReview />} />
        </Route>
        <Route element={<RequireRole roles={['CLIENT', 'ADMIN']} />}>
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/pedido" element={<MyOrder />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
