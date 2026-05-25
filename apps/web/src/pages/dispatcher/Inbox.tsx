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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
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

        {/* Table */}
        <div className="container" style={{ padding: '24px 24px 64px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
                <h3 style={{ fontSize: 18 }}>No hay pedidos en esta categoría</h3>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1.4fr 90px 150px 150px 150px',
                    gap: 12,
                    padding: '12px 18px',
                    borderBottom: '1.5px solid var(--line)',
                    background: 'var(--bg-tint)',
                  }}
                  className="label"
                >
                  <span>Pedido</span>
                  <span>Cliente</span>
                  <span style={{ textAlign: 'right' }}>Ítems</span>
                  <span>Estado</span>
                  <span>Recibido</span>
                  <span style={{ textAlign: 'right' }}>Acción</span>
                </div>
                {filtered.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => navigate(`/despacho/pedido/${o.id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1.4fr 90px 150px 150px 150px',
                      gap: 12,
                      padding: '14px 18px',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--line-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>
                      #{o.id.slice(-8)}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{o.client?.fullName ?? '—'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{o.client?.email}</div>
                    </div>
                    <span style={{ textAlign: 'right', fontSize: 14 }}>{o._count.items}</span>
                    <StatusTag status={o.status} />
                    <span className="muted" style={{ fontSize: 12 }}>{shortDate(o.createdAt)}</span>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        className={`btn sm ${o.status === 'SENT' ? 'primary' : 'ghost'}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/despacho/pedido/${o.id}`)
                        }}
                        style={{ fontSize: 12 }}
                      >
                        {o.status === 'SENT' ? 'Revisar →' : 'Ver'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
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
