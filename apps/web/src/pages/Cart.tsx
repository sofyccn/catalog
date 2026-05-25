import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Minus, Plus, Send, ShoppingCart, Trash2 } from 'lucide-react'
import { Header } from '../components/Header'
import { ProductThumb } from '../components/ProductThumb'
import { cartCount, useCart } from '../stores/cart'
import { useSendOrder } from '../api/requests'
import { getApiErrorMessage } from '../lib/api'

const qtyBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '8px 12px',
  cursor: 'pointer',
  color: 'var(--ink-soft)',
  display: 'inline-flex',
}

export default function Cart() {
  const navigate = useNavigate()
  const lines = useCart((s) => s.lines)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)
  const sendOrder = useSendOrder()
  const [note, setNote] = useState('')
  const [delivery, setDelivery] = useState<'retiro' | 'envio'>('retiro')

  const units = cartCount(lines)

  const handleSend = () => {
    const deliveryLabel = delivery === 'retiro' ? 'Retiro en local' : 'Envío a finca'
    const notes = [deliveryLabel, note.trim()].filter(Boolean).join(' — ')
    sendOrder.mutate(
      { items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })), notes },
      {
        onSuccess: () => {
          clear()
          navigate('/pedido')
        },
      },
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      {lines.length === 0 ? (
        <main className="container" style={{ padding: '64px 24px', maxWidth: 560 }}>
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'var(--bg-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-faint)',
              }}
            >
              <ShoppingCart size={34} strokeWidth={1.6} />
            </div>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>Tu carrito está vacío</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Encuentra lo que necesitas en el catálogo y vuelve aquí para enviar tu pedido.
            </p>
            <button onClick={() => navigate('/catalogo')} className="btn primary lg">
              Ir al catálogo
            </button>
          </div>
        </main>
      ) : (
        <main className="fade-up">
          <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
            <div className="container" style={{ padding: '28px 24px' }}>
              <div className="label">Tu pedido</div>
              <h1 style={{ fontSize: 40, marginTop: 4 }}>
                Carrito · {lines.length} {lines.length === 1 ? 'producto' : 'productos'}
              </h1>
              <p className="muted" style={{ marginTop: 4 }}>
                Cuando estés listo, lo enviamos al despachador. Revisa la disponibilidad y te
                responde en pocas horas.
              </p>
            </div>
          </div>

          <div
            className="container"
            style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, padding: '32px 24px 64px' }}
          >
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="label">Productos</span>
                <button
                  onClick={() => navigate('/catalogo')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}
                >
                  ← Seguir buscando
                </button>
              </div>
              {lines.map((l) => (
                <div
                  key={l.productId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 130px 30px',
                    gap: 18,
                    padding: '18px 20px',
                    borderBottom: '1px solid var(--line-soft)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: 90, height: 80, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-tint)' }}>
                    <ProductThumb src={l.image} alt={l.name} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                      {l.name}
                    </h4>
                    <span className="tag muted">{l.code}</span>
                  </div>
                  <div className="row" style={{ background: 'var(--bg-tint)', borderRadius: 999, overflow: 'hidden' }}>
                    <button onClick={() => setQty(l.productId, l.quantity - 1)} style={qtyBtn} aria-label="Menos">
                      <Minus size={14} />
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {l.quantity}
                    </span>
                    <button onClick={() => setQty(l.productId, l.quantity + 1)} style={qtyBtn} aria-label="Más">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.productId)}
                    aria-label="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 20, marginBottom: 12 }}>Resumen</h3>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                  <span className="muted">Productos</span>
                  <span style={{ fontWeight: 600 }}>{lines.length}</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 14, marginTop: 6 }}>
                  <span className="muted">Unidades</span>
                  <span style={{ fontWeight: 600 }}>{units}</span>
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                  La disponibilidad se confirma cuando el despachador revise tu pedido.
                </p>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div className="label" style={{ marginBottom: 8 }}>Entrega</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {([['retiro', 'Retiro en local'], ['envio', 'Envío a finca']] as const).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setDelivery(k)}
                      className={`chip ${delivery === k ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '8px 12px' }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="label" style={{ marginBottom: 8 }}>Nota (opcional)</div>
                <textarea
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ej: si no hay el de 20L mándame el de 16L, lo necesito para el lunes…"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {sendOrder.isError && (
                <p style={{ color: 'var(--red)', fontSize: 13 }}>{getApiErrorMessage(sendOrder.error)}</p>
              )}
              <button onClick={handleSend} disabled={sendOrder.isPending} className="btn primary lg" style={{ padding: 16, fontSize: 16 }}>
                {sendOrder.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {sendOrder.isPending ? 'Enviando…' : 'Enviar pedido al despachador'}
              </button>
              <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
                Recibirás la confirmación de disponibilidad en pocas horas. Luego decides si aceptas,
                rechazas o cancelas.
              </p>
            </aside>
          </div>
        </main>
      )}
    </div>
  )
}
