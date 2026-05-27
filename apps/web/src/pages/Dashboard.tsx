import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Inbox, Package, UserPlus } from 'lucide-react'
import { WorkerHeader } from '../components/WorkerHeader'
import { useMe } from '../api/me'
import { useAdminProducts } from '../api/admin'
import { useRequests } from '../api/requests'
import { usePendingUsers } from '../api/users'

/** Admin landing hub: interactive tiles linking to the main areas, with live counts. */
export default function Dashboard() {
  const me = useMe()
  const products = useAdminProducts()
  const newOrders = useRequests('SENT')
  const pending = usePendingUsers()

  const firstName = me.data?.fullName?.split(' ')[0] ?? ''
  const productCount = products.data?.total
  const newCount = newOrders.data?.length ?? 0
  const pendingCount = pending.data?.length ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <WorkerHeader />
      <main className="fade-up">
        {/* Welcome strip */}
        <div style={{ background: 'var(--green-deep)', color: 'white', padding: '36px 0' }}>
          <div className="container">
            <span className="label" style={{ color: 'var(--amber-bright)' }}>Panel de administración</span>
            <h1 style={{ fontSize: 38, color: 'white', marginTop: 4 }}>
              Hola, <em style={{ color: 'var(--amber-bright)', fontStyle: 'italic' }}>{firstName || 'administrador'}</em>
            </h1>
            <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
              {pendingCount > 0
                ? <>Tienes <b style={{ color: 'var(--amber-bright)' }}>{pendingCount} solicitud(es) de acceso</b> y <b style={{ color: 'var(--amber-bright)' }}>{newCount} pedido(s) nuevo(s)</b> esperando.</>
                : newCount > 0
                  ? <>Tienes <b style={{ color: 'var(--amber-bright)' }}>{newCount} pedido(s) nuevo(s)</b> por revisar.</>
                  : 'Todo al día. Desde aquí gestionas el catálogo, los pedidos y los accesos.'}
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '32px 24px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <Tile
              to="/admin/catalogo"
              icon={<Package size={24} />}
              color="var(--green)"
              tint="var(--green-tint)"
              title="Catálogo"
              desc="Crea y edita productos, categorías, marcas y modelos."
              meta={productCount === undefined ? 'Cargando…' : `${productCount} producto${productCount === 1 ? '' : 's'}`}
            />
            <Tile
              to="/despacho"
              icon={<Inbox size={24} />}
              color="var(--amber)"
              tint="var(--amber-tint)"
              title="Pedidos"
              desc="Revisa los pedidos de los clientes y confirma disponibilidad."
              meta={newCount > 0 ? `${newCount} nuevo${newCount === 1 ? '' : 's'} por revisar` : 'Sin pedidos nuevos'}
              badge={newCount > 0 ? newCount : undefined}
            />
            <Tile
              to="/admin/solicitudes"
              icon={<UserPlus size={24} />}
              color="var(--blue)"
              tint="var(--blue-tint)"
              title="Solicitudes de acceso"
              desc="Aprueba o rechaza nuevos usuarios y asigna su rol."
              meta={pendingCount > 0 ? `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}` : 'Nada pendiente'}
              badge={pendingCount > 0 ? pendingCount : undefined}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

interface TileProps {
  to: string
  icon: React.ReactNode
  color: string
  tint: string
  title: string
  desc: string
  meta: string
  badge?: number
}

function Tile({ to, icon, color, tint, title, desc, meta, badge }: TileProps) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      to={to}
      className="card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? 'var(--shadow-md)' : 'none',
      }}
    >
      {badge !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            minWidth: 24,
            height: 24,
            padding: '0 7px',
            background: 'var(--red)',
            color: 'white',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
      <span style={{ width: 52, height: 52, borderRadius: 14, background: tint, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <h2 style={{ fontSize: 22 }}>{title}</h2>
      <p className="muted" style={{ fontSize: 14, flex: 1 }}>{desc}</p>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span className="label" style={{ color }}>{meta}</span>
        <ArrowRight size={18} style={{ color, transition: 'transform 120ms ease', transform: hover ? 'translateX(3px)' : 'none' }} />
      </div>
    </Link>
  )
}
