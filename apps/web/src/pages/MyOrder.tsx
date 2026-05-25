import { useNavigate } from 'react-router-dom'
import { Ban, Check, CircleCheck, Clock, Loader2, X } from 'lucide-react'
import { Header } from '../components/Header'
import {
  useClientDecision,
  useRequestDetail,
  useRequests,
  type OrderRequest,
  type RequestItemDetail,
} from '../api/requests'

export default function MyOrder() {
  const navigate = useNavigate()
  const list = useRequests()
  const latestId = list.data?.[0]?.id
  const detail = useRequestDetail(latestId)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      {list.isLoading || (latestId && detail.isLoading) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
        </div>
      ) : !latestId || !detail.data ? (
        <main className="container" style={{ padding: '64px 24px', maxWidth: 560, textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>No tienes pedidos aún</h2>
          <p className="muted" style={{ marginBottom: 16 }}>Cuando envíes un pedido aparecerá aquí.</p>
          <button onClick={() => navigate('/catalogo')} className="btn primary">
            Ir al catálogo
          </button>
        </main>
      ) : (
        <OrderView order={detail.data} />
      )}
    </div>
  )
}

function OrderView({ order }: { order: OrderRequest }) {
  const navigate = useNavigate()
  const approve = useClientDecision('approve')
  const reject = useClientDecision('reject')
  const cancel = useClientDecision('cancel')
  const busy = approve.isPending || reject.isPending || cancel.isPending

  if (order.status === 'APPROVED' || order.status === 'REJECTED' || order.status === 'CANCELLED') {
    return <TerminalView order={order} onBack={() => navigate('/catalogo')} />
  }

  const reviewed = order.status === 'REVIEWED'

  return (
    <main className="fade-up">
      {/* Status banner */}
      <div
        style={{
          background: reviewed
            ? 'linear-gradient(135deg, var(--amber-tint), var(--amber-soft))'
            : 'linear-gradient(135deg, var(--blue-tint), #c9d6f5)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="container" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
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
                : 'El despachador está revisando la disponibilidad. Te avisamos por aquí cuando esté listo.'}
            </p>
          </div>
          <span
            className="tag"
            style={{ background: 'white', color: reviewed ? 'var(--amber)' : 'var(--blue)', padding: '6px 14px', fontSize: 13 }}
          >
            {reviewed ? 'esperando tu respuesta' : 'en revisión'}
          </span>
        </div>
      </div>

      <div
        className="container"
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, padding: '32px 24px 64px' }}
      >
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

        <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewed ? (
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>¿Cómo continuamos?</h3>
              <button onClick={() => approve.mutate(order.id)} disabled={busy} className="btn primary lg" style={{ padding: 14 }}>
                <Check size={18} /> Aceptar
              </button>
              <button onClick={() => reject.mutate(order.id)} disabled={busy} className="btn ghost" style={{ padding: 12 }}>
                <X size={16} /> Rechazar
              </button>
              <button
                onClick={() => cancel.mutate(order.id)}
                disabled={busy}
                className="btn"
                style={{ padding: 10, fontSize: 13, background: 'transparent', color: 'var(--red)', fontWeight: 500 }}
              >
                Cancelar pedido
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                Tu pedido está en manos del despachador. Puedes cancelarlo mientras tanto.
              </p>
              <button
                onClick={() => cancel.mutate(order.id)}
                disabled={busy}
                className="btn ghost"
                style={{ width: '100%', color: 'var(--red)' }}
              >
                Cancelar pedido
              </button>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <span className="label" style={{ marginBottom: 12, display: 'block' }}>Línea de tiempo</span>
            <Timeline
              events={[
                ['done', 'Pedido enviado', null],
                [order.status === 'SENT' ? 'active' : 'done', 'El despachador revisa', null],
                [reviewed ? 'active' : order.status === 'SENT' ? 'pending' : 'done', 'Disponibilidad lista', null],
                ['pending', 'Tu decisión', null],
              ]}
            />
          </div>
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
    APPROVED: { color: 'var(--green)', tint: 'var(--green-tint)', icon: <CircleCheck size={40} color="white" />, title: '¡Listo, pedido aprobado!', sub: 'El despachador preparará lo disponible y te avisará cuando esté listo.' },
    REJECTED: { color: 'var(--red)', tint: 'var(--red-tint)', icon: <X size={40} color="white" />, title: 'Pedido rechazado', sub: 'Rechazaste la disponibilidad ofrecida. Puedes armar un nuevo pedido cuando quieras.' },
    CANCELLED: { color: 'var(--ink-faint)', tint: 'var(--bg-tint)', icon: <Ban size={36} color="white" />, title: 'Pedido cancelado', sub: 'Cancelaste este pedido. Cuando quieras, vuelve a empezar.' },
  } as const
  const v = map[order.status as 'APPROVED' | 'REJECTED' | 'CANCELLED']
  return (
    <main className="container" style={{ padding: '64px 24px', maxWidth: 580 }}>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: v.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {v.icon}
        </div>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>{v.title}</h2>
        <p className="muted" style={{ marginBottom: 28 }}>{v.sub}</p>
        <button onClick={onBack} className="btn primary">
          Volver al catálogo
        </button>
      </div>
    </main>
  )
}

type TimelineState = 'done' | 'active' | 'pending'
function Timeline({ events }: { events: Array<[TimelineState, string, string | null]> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {events.map(([state, label, time], i) => (
        <div key={i} className="row" style={{ gap: 12, paddingBottom: i < events.length - 1 ? 14 : 0, position: 'relative' }}>
          {i < events.length - 1 && (
            <div style={{ position: 'absolute', left: 9, top: 22, bottom: 0, width: 2, background: state === 'done' ? 'var(--green)' : 'var(--line)' }} />
          )}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              zIndex: 1,
              background: state === 'done' ? 'var(--green)' : state === 'active' ? 'var(--amber-bright)' : 'var(--bg-tint)',
              border: state === 'pending' ? '2px solid var(--line)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {state === 'done' && <Check size={11} color="white" />}
          </div>
          <div style={{ flex: 1, paddingTop: 1 }}>
            <div style={{ fontSize: 13, fontWeight: state === 'pending' ? 400 : 600, color: state === 'pending' ? 'var(--ink-faint)' : 'var(--ink)' }}>
              {label}
            </div>
            {time && <div className="muted" style={{ fontSize: 11 }}>{time}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
