import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Header } from '../components/Header'
import { ProductThumb } from '../components/ProductThumb'
import { formatPrice, useProduct, useRelatedProducts } from '../api/catalog'
import { useCart } from '../stores/cart'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id)
  const related = useRelatedProducts(id)
  const addToCart = useCart((s) => s.add)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (!product) return
    addToCart({
      productId: product.id,
      code: product.code,
      name: product.name,
      image: product.images?.[0]?.urlThumb,
      price: product.price ?? undefined,
      quantity: qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
        </div>
      ) : !product ? (
        <main className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Producto no encontrado</h2>
          <button onClick={() => navigate('/catalogo')} className="btn primary">Volver al catálogo</button>
        </main>
      ) : (
        <main className="fade-up">
          <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
            <div className="container" style={{ padding: '10px 24px', fontSize: 13 }}>
              <Link to="/catalogo" className="muted">Catálogo</Link>
              {product.category && (
                <>
                  <span className="faint" style={{ margin: '0 8px' }}>›</span>
                  <span className="muted">{product.category.name}</span>
                </>
              )}
              <span className="faint" style={{ margin: '0 8px' }}>›</span>
              <span>{product.name}</span>
            </div>
          </div>

          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, padding: '40px 24px 48px' }}>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '4 / 3', position: 'relative' }}>
              <ProductThumb src={product.images?.[0]?.urlFull ?? product.images?.[0]?.urlMedium} alt={product.name} />
              {product.isNew && (
                <span className="tag" style={{ position: 'absolute', top: 14, left: 14, background: 'var(--amber-bright)', color: 'var(--ink)' }}>NUEVO</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 520 }}>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <span className="tag muted">{product.code}</span>
                {product.category && <span className="muted" style={{ fontSize: 13 }}>{product.category.name}</span>}
                {product.partType && <span className="muted" style={{ fontSize: 13 }}>· {product.partType.name}</span>}
                {product.brand && <span className="muted" style={{ fontSize: 13 }}>· {product.brand.name}</span>}
              </div>
              <h1 style={{ fontSize: 38, marginTop: 0 }}>{product.name}</h1>

              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--green)' }}>{formatPrice(product.price)}</span>
                <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>precio de referencia</span>
                <p className="muted" style={{ fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                  El precio y la disponibilidad finales se confirman cuando el despachador revise tu pedido.
                </p>
              </div>

              {product.description && <p style={{ fontSize: 15, lineHeight: 1.55 }}>{product.description}</p>}

              {product.compatibleModels && product.compatibleModels.length > 0 && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>Compatible con</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {product.compatibleModels.map((m) => (
                      <span key={m.model.code} className="chip" style={{ background: 'transparent', border: '1px solid var(--line)' }}>
                        {m.model.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: 16, background: 'var(--bg-tint)', borderColor: 'var(--line-soft)' }}>
                <div className="row" style={{ gap: 14 }}>
                  <div className="row" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ background: 'transparent', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', display: 'inline-flex' }} aria-label="Menos"><Minus size={16} /></button>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, padding: '0 14px', minWidth: 30, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} style={{ background: 'transparent', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', display: 'inline-flex' }} aria-label="Más"><Plus size={16} /></button>
                  </div>
                  <button onClick={handleAdd} className="btn primary lg" style={{ flex: 1 }}>
                    <ShoppingCart size={18} />
                    {added ? 'Añadido ✓' : `Añadir al pedido${qty > 1 ? ` · ${qty}` : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {related.data && related.data.length > 0 && (
            <section style={{ borderTop: '1px solid var(--line)', padding: '32px 0 56px' }}>
              <div className="container">
                <h2 style={{ fontSize: 24, marginBottom: 18 }}>Productos relacionados</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {related.data.map((p) => (
                    <Link key={p.id} to={`/producto/${p.id}`} className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden' }}>
                        <ProductThumb src={p.images?.[0]?.urlThumb} alt={p.name} />
                      </div>
                      <span className="tag muted" style={{ width: 'fit-content' }}>{p.code}</span>
                      <h3 style={{ fontSize: 14, lineHeight: 1.25 }}>{p.name}</h3>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{formatPrice(p.price)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  )
}
