import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import { WorkerHeader, StatusTag, shortDate } from '../../components/WorkerHeader'
import { getApiErrorMessage } from '../../lib/api'
import {
  useCompleteReview,
  useRequestDetail,
  useReviewItem,
  useStartReview,
  type RequestItemDetail,
} from '../../api/requests'

export default function DispatcherOrderReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const detail = useRequestDetail(id)
  const startReview = useStartReview()
  const completeReview = useCompleteReview()

  if (detail.isLoading || !id) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <WorkerHeader />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
        </div>
      </div>
    )
  }
  if (!detail.data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <WorkerHeader />
        <main className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Pedido no encontrado</h2>
          <button onClick={() => navigate('/despacho')} className="btn primary">
            ← Volver a pedidos
          </button>
        </main>
      </div>
    )
  }

  const order = detail.data
  const editable = order.status === 'IN_REVIEW'
  const pendingItems = order.items.filter((it) => it.available === null).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <WorkerHeader />
      <main className="fade-up">
        <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
          <div className="container" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/despacho')} className="btn ghost sm">
              <ArrowLeft size={14} /> Pedidos
            </button>
            <div style={{ flex: 1 }}>
              <span className="label">Pedido</span>
              <h1 style={{ fontSize: 26, marginTop: 2 }}>#{order.id.slice(-8)}</h1>
            </div>
            <StatusTag status={order.status} />
          </div>
        </div>

        <div className="container grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 32, padding: '32px 24px 64px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{order.client?.fullName}</div>
                <div className="muted" style={{ fontSize: 12 }}>{order.client?.email} · enviado {order.sentAt ? shortDate(order.sentAt) : shortDate(order.createdAt)}</div>
              </div>
            </div>

            {order.notes && (
              <div style={{ padding: 16, borderRadius: 12, border: '1px dashed var(--line)', background: 'var(--card)' }}>
                <div className="label" style={{ marginBottom: 4 }}>Nota del cliente</div>
                <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)' }}>"{order.notes}"</p>
              </div>
            )}

            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <span className="label">Productos {editable ? '· marca disponibilidad' : ''}</span>
              </div>
              {order.items.map((it, i) => (
                <ItemReviewRow
                  key={it.id}
                  requestId={order.id}
                  item={it}
                  editable={editable}
                  last={i === order.items.length - 1}
                />
              ))}
            </div>
          </div>

          <aside className="sticky-aside" style={{ position: 'sticky', top: 96, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>Resumen</h3>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span className="muted">Productos</span>
                <span style={{ fontWeight: 600 }}>{order.items.length}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                <span className="muted">Unidades</span>
                <span style={{ fontWeight: 600 }}>{order.items.reduce((s, it) => s + it.quantity, 0)}</span>
              </div>
            </div>

            {order.status === 'SENT' && (
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => startReview.mutate(order.id)} disabled={startReview.isPending} className="btn primary lg" style={{ padding: 14 }}>
                  {startReview.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
                  Iniciar revisión
                </button>
                {startReview.isError && <p style={{ color: 'var(--red)', fontSize: 13 }}>{getApiErrorMessage(startReview.error)}</p>}
              </div>
            )}

            {editable && (
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingItems > 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Te faltan <b>{pendingItems}</b> ítem(s) por marcar.
                  </p>
                )}
                <button
                  onClick={() => completeReview.mutate(order.id, { onSuccess: () => navigate('/despacho') })}
                  disabled={completeReview.isPending}
                  className="btn primary lg"
                  style={{ padding: 14 }}
                >
                  {completeReview.isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  Enviar disponibilidad al cliente
                </button>
                {completeReview.isError && <p style={{ color: 'var(--red)', fontSize: 13 }}>{getApiErrorMessage(completeReview.error)}</p>}
              </div>
            )}

            {(order.status === 'REVIEWED' || order.status === 'APPROVED' || order.status === 'REJECTED' || order.status === 'CANCELLED') && (
              <div className="card" style={{ padding: 20, textAlign: 'center', background: 'var(--bg-tint)' }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {order.status === 'REVIEWED' && 'Disponibilidad enviada. Esperando la decisión del cliente.'}
                  {order.status === 'APPROVED' && 'El cliente aprobó. Listo para preparar.'}
                  {order.status === 'REJECTED' && 'El cliente rechazó la proforma.'}
                  {order.status === 'CANCELLED' && 'Pedido cancelado.'}
                </span>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

function ItemReviewRow({
  requestId,
  item,
  editable,
  last,
}: {
  requestId: string
  item: RequestItemDetail
  editable: boolean
  last: boolean
}) {
  const review = useReviewItem(requestId)
  const [obs, setObs] = useState(item.observations ?? '')

  const saveObs = () => {
    if (obs !== (item.observations ?? '')) review.mutate({ itemId: item.id, observations: obs })
  }

  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: last ? 'none' : '1px solid var(--line-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{item.product.name}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            <span className="tag muted" style={{ marginRight: 6 }}>{item.product.code}</span>
            solicitado × {item.quantity}
          </div>
        </div>

        {editable ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => review.mutate({ itemId: item.id, available: true })}
              className={`btn sm ${item.available === true ? 'primary' : 'ghost'}`}
            >
              <Check size={14} /> Disponible
            </button>
            <button
              onClick={() => review.mutate({ itemId: item.id, available: false })}
              className="btn sm ghost"
              style={item.available === false ? { background: 'var(--red)', color: 'white', borderColor: 'var(--red)' } : undefined}
            >
              <X size={14} /> Sin stock
            </button>
          </div>
        ) : (
          <div>
            {item.available === true ? (
              <span className="tag" style={{ background: 'var(--ok-tint)', color: 'var(--ok)' }}>Disponible</span>
            ) : item.available === false ? (
              <span className="tag" style={{ background: 'var(--red-tint)', color: 'var(--red)' }}>Sin stock</span>
            ) : (
              <span className="tag muted">Sin revisar</span>
            )}
          </div>
        )}
      </div>

      {editable ? (
        <input
          className="input"
          defaultValue={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={saveObs}
          placeholder="Observación (opcional): ej. llega el lunes, hay color azul…"
          style={{ fontSize: 13 }}
        />
      ) : (
        item.observations && <p className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>{item.observations}</p>
      )}
    </div>
  )
}
