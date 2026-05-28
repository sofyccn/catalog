import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Check, ChevronRight, CircleCheck, Clock, Loader2, X } from 'lucide-react'
import { Header } from '../components/Header'
import { StatusTag, shortDate } from '../components/WorkerHeader'
import {
  useClientDecision,
  useRequestDetail,
  useRequests,
  type OrderRequest,
  type RequestItemDetail,
} from '../api/requests'

export default function MyOrder() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (selectedId) return <OrderDetail id={selectedId} onBack={() => setSelectedId(null)} />
  return <OrdersList onSelect={setSelectedId} />
}

function OrdersList({ onSelect }: { onSelect: (id: string) => void }) {
  const navigate = useNavigate()
  const list = useRequests()
  const orders = list.data ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <main className="fade-up">
        <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
          <div className="container" style={{ padding: '28px 24px' }}>
            <div className="label">Tus pedidos</div>
            <h1 style={{ fontSize: 36, marginTop: 4 }}>Mis pedidos</h1>
          </div>
        </div>

        <div className="container" style={{ padding: '24px 24px 64px', maxWidth: 820 }}>
          {list.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>No tienes pedidos aún</h2>
              <p className="muted" style={{ marginBottom: 16 }}>Cuando envíes un pedido aparecerá aquí.</p>
              <button onClick={() => navigate('/catalogo')} className="btn primary">Ir al catálogo</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="card"
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '18px 20px', alignItems: 'center', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--line)' }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Pedido #{o.id.slice(-8)}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {shortDate(o.createdAt)} · {o._count.items} {o._count.items === 1 ? 'producto' : 'productos'}
                    </div>
                  </div>
                  <StatusTag status={o.status} />
                  <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function OrderDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const detail = useRequestDetail(id)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      {detail.isLoading || !detail.data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
        </div>
      ) : (
        <OrderView order={detail.data} onBack={onBack} />
      )}
    </div>
  )
}

function OrderView({ order, onBack }: { order: OrderRequest; onBack: () => void }) {
  const approve = useClientDecision('approve')
  const reject = useClientDecision('reject')
  const cancel = useClientDecision('cancel')
  const busy = approve.isPending || reject.isPending || cancel.isPending

  if (order.status === 'APPROVED' || order.status === 'REJECTED' || order.status === 'CANCELLED') {
    return <TerminalView order={order} onBack={onBack} />
  }

  const reviewed = order.status === 'REVIEWED'

  return (
    <main className="fade-up">
      <div
        style={{
          background: reviewed
            ? 'linear-gradient(135deg, var(--amber-tint), var(--amber-soft))'
            : 'linear-gradient(135deg, var(--blue-tint), #c9d6f5)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="container" style={{ padding: '16px 24px' }}>
          <button onClick={onBack} className="btn ghost sm" style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Mis pedidos
          </button>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: reviewed ? 'var(--amber-bright)' : 'var(--blue)',
                color: reviewed ? 'var(--ink)' : 'white',
              }}
            >
              <Clock size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                {reviewed ? 'Disponibilidad confirmada' : 'Pedido enviado · esperando respuesta'}
              </h3>
              <p className="muted" style={{ fontSize: 14 }}>
                {reviewed
                  ? 'El despachador revisó tu pedido. Revisa qué hay disponible y decide cómo continuar.'
                  : 'El despachador está revisando la disponibilidad.'}
              </p>
            </div>
            <span className="tag" style={{ background: 'white', color: reviewed ? 'var(--amber)' : 'var(--blue)', padding: '6px 14px', fontSize: 13 }}>
              {reviewed ? 'esperando tu respuesta' : 'en revisión'}
            </span>
          </div>
        </div>
      </div>

      <div className="container grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <span className="label">Pedido</span>
            <h2 style={{ fontSize: 26, marginTop: 4 }}>#{order.id.slice(-8)}</h2>
            <p className="muted" style={{ marginTop: 4, fontSize: 14 }}>
              {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'} ·{' '}
              {order.items.reduce((s, it) => s + it.quantity, 0)} unidades
            </p>
            {order.notes && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-tint)', marginTop: 16, fontSize: 14, fontStyle: 'italic' }}>
                <span className="label" style={{ marginRight: 8 }}>Tu nota:</span>
                {order.notes}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <span className="label">{reviewed ? 'Disponibilidad' : 'Productos solicitados'}</span>
            </div>
            {order.items.map((it, i) => (
              <ItemRow key={it.id} item={it} reviewed={reviewed} last={i === order.items.length - 1} />
            ))}
          </div>
        </div>

        <aside className="sticky-aside" style={{ position: 'sticky', top: 96, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewed ? (
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>¿Cómo continuamos?</h3>
              <button onClick={() => approve.mutate(order.id)} disabled={busy} className="btn primary lg" style={{ padding: 14 }}>
                <Check size={18} /> Aceptar
              </button>
              <button onClick={() => reject.mutate(order.id)} disabled={busy} className="btn ghost" style={{ padding: 12 }}>
                <X size={16} /> Rechazar
              </button>
              <button onClick={() => cancel.mutate(order.id)} disabled={busy} className="btn" style={{ padding: 10, fontSize: 13, background: 'transparent', color: 'var(--red)', fontWeight: 500 }}>
                Cancelar pedido
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                Tu pedido está en manos del despachador. Puedes cancelarlo mientras tanto.
              </p>
              <button onClick={() => cancel.mutate(order.id)} disabled={busy} className="btn ghost" style={{ width: '100%', color: 'var(--red)' }}>
                Cancelar pedido
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

function ItemRow({ item, reviewed, last }: { item: RequestItemDetail; reviewed: boolean; last: boolean }) {
  const avail = item.available
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 70px 150px',
        gap: 12,
        padding: '14px 20px',
        alignItems: 'center',
        borderBottom: last ? 'none' : '1px solid var(--line-soft)',
        background: reviewed && avail === false ? 'rgba(185, 28, 28, 0.03)' : 'transparent',
        opacity: reviewed && avail === false ? 0.75 : 1,
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{item.product.name}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          <span className="tag muted" style={{ marginRight: 6 }}>{item.product.code}</span>
          {item.observations && <span style={{ fontStyle: 'italic' }}>· {item.observations}</span>}
        </div>
      </div>
      <span className="muted" style={{ textAlign: 'right' }}>× {item.quantity}</span>
      <div style={{ textAlign: 'right' }}>
        {!reviewed ? (
          <span className="muted" style={{ fontSize: 13 }}>solicitado</span>
        ) : avail === true ? (
          <span className="tag" style={{ background: 'var(--ok-tint)', color: 'var(--ok)' }}>Disponible</span>
        ) : avail === false ? (
          <span className="tag" style={{ background: 'var(--red-tint)', color: 'var(--red)' }}>Sin stock</span>
        ) : (
          <span className="tag muted">Sin revisar</span>
        )}
      </div>
    </div>
  )
}

function TerminalView({ order, onBack }: { order: OrderRequest; onBack: () => void }) {
  const map = {
    APPROVED: { color: 'var(--green)', icon: <CircleCheck size={40} color="white" />, title: '¡Listo, pedido aprobado!', sub: 'El despachador preparará lo disponible y te avisará cuando esté listo.' },
    REJECTED: { color: 'var(--red)', icon: <X size={40} color="white" />, title: 'Pedido rechazado', sub: 'Rechazaste la disponibilidad ofrecida. Puedes armar un nuevo pedido cuando quieras.' },
    CANCELLED: { color: 'var(--ink-faint)', icon: <Ban size={36} color="white" />, title: 'Pedido cancelado', sub: 'Cancelaste este pedido.' },
  } as const
  const v = map[order.status as 'APPROVED' | 'REJECTED' | 'CANCELLED']
  const availableCount = order.items.filter((it) => it.available === true).length
  const units = order.items.reduce((s, it) => s + it.quantity, 0)
  return (
    <main className="container" style={{ padding: '48px 24px', maxWidth: 680 }}>
      <button onClick={onBack} className="btn ghost sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> Mis pedidos
      </button>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {v.icon}
        </div>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>{v.title}</h2>
        <p className="muted" style={{ marginBottom: 12 }}>{v.sub}</p>
        <p className="faint" style={{ fontSize: 13 }}>
          Pedido #{order.id.slice(-8)}
          {order.decidedAt ? ` · ${shortDate(order.decidedAt)}` : ''}
        </p>
      </div>

      {/* Listado de productos — queda como historial de la compra */}
      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="label">Detalle del pedido</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {order.status === 'APPROVED'
              ? `${availableCount} de ${order.items.length} disponibles`
              : `${order.items.length} producto${order.items.length === 1 ? '' : 's'} · ${units} unidades`}
          </span>
        </div>
        {order.items.map((it, i) => (
          <ItemRow key={it.id} item={it} reviewed last={i === order.items.length - 1} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={onBack} className="btn primary">Volver a mis pedidos</button>
      </div>
    </main>
  )
}
