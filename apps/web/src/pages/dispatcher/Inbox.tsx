import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { WorkerHeader, StatusTag, shortDate } from '../../components/WorkerHeader'
import { useRequests, type RequestStatus, type RequestSummary } from '../../api/requests'

type TabKey = 'TODOS' | 'SENT' | 'IN_REVIEW' | 'REVIEWED' | 'CLOSED'
const CLOSED: RequestStatus[] = ['APPROVED', 'REJECTED', 'CANCELLED']

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'SENT', label: 'Nuevos' },
  { key: 'IN_REVIEW', label: 'En revisión' },
  { key: 'REVIEWED', label: 'Enviados' },
  { key: 'CLOSED', label: 'Cerrados' },
]

function inTab(o: RequestSummary, tab: TabKey): boolean {
  if (tab === 'TODOS') return true
  if (tab === 'CLOSED') return CLOSED.includes(o.status)
  return o.status === tab
}

export default function DispatcherInbox() {
  const navigate = useNavigate()
  const { data, isLoading } = useRequests()
  const [tab, setTab] = useState<TabKey>('TODOS')
  const orders = data ?? []

  const count = (k: TabKey) => orders.filter((o) => inTab(o, k)).length
  const kpi = (s: RequestStatus) => orders.filter((o) => o.status === s).length
  const filtered = orders.filter((o) => inTab(o, tab))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <WorkerHeader />
      <main className="fade-up">
        {/* Greeting strip */}
        <div style={{ background: 'var(--green-deep)', color: 'white', padding: '32px 0' }}>
          <div className="container">
            <span className="label" style={{ color: 'var(--amber-bright)' }}>Panel interno · despacho</span>
            <h1 style={{ fontSize: 36, color: 'white', marginTop: 4 }}>Pedidos</h1>
            <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
              {kpi('SENT') > 0 ? (
                <>
                  Tienes <b style={{ color: 'var(--amber-bright)' }}>{kpi('SENT')} pedido(s) nuevo(s)</b> esperando revisión.
                </>
              ) : (
                'No hay pedidos nuevos por ahora.'
              )}
            </p>
            <div className="kpis-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
              <Kpi label="nuevos sin revisar" value={kpi('SENT')} accent />
              <Kpi label="en revisión" value={kpi('IN_REVIEW')} />
              <Kpi label="proformas enviadas" value={kpi('REVIEWED')} />
              <Kpi label="aprobados" value={kpi('APPROVED')} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
          <div className="container" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === t.key ? 'var(--ink)' : 'var(--bg-tint)',
                  color: tab === t.key ? 'white' : 'var(--ink-soft)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {t.label}
                <span
                  style={{
                    background: tab === t.key ? 'rgba(255,255,255,0.18)' : 'var(--line)',
                    padding: '0 6px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {count(t.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="container orders-wrap" style={{ padding: '24px 24px 64px' }}>
          <div className="card orders-card" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
                <h3 style={{ fontSize: 18 }}>No hay pedidos en esta categoría</h3>
              </div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.id}
                  className="order-row"
                  onClick={() => navigate(`/despacho/pedido/${o.id}`)}
                >
                  <span className="order-row__id">#{o.id.slice(-8)}</span>
                  <div className="order-row__client">
                    <div className="order-row__name">{o.client?.fullName ?? '—'}</div>
                    <div className="order-row__email">{o.client?.email}</div>
                  </div>
                  <div className="order-row__meta">
                    <span>{o._count.items} ítem{o._count.items !== 1 ? 's' : ''}</span>
                    <span aria-hidden="true">·</span>
                    <span>{shortDate(o.createdAt)}</span>
                  </div>
                  <div className="order-row__status">
                    <StatusTag status={o.status} />
                  </div>
                  <button
                    className={`order-row__action btn sm ${o.status === 'SENT' ? 'primary' : 'ghost'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/despacho/pedido/${o.id}`)
                    }}
                  >
                    {o.status === 'SENT' ? 'Revisar →' : 'Ver'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'white' }}>{value}</span>
        {accent && value > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-bright)' }} />}
      </div>
    </div>
  )
}
