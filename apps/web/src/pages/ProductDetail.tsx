import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, ShoppingCart, X, ZoomIn } from 'lucide-react'
import { Header } from '../components/Header'
import { ProductThumb } from '../components/ProductThumb'
import { formatPrice, useProduct, useRelatedProducts } from '../api/catalog'
import { useCart } from '../stores/cart'

/** Keyed by id so photo selection and quantity reset when jumping to a
 *  related product (same route, so React would otherwise keep the state). */
export default function ProductDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return <ProductDetail key={id} id={id} />
}

function ProductDetail({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id)
  const related = useRelatedProducts(id)
  const addToCart = useCart((s) => s.add)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images = product?.images ?? []
  const hasImages = images.length > 0
  const mainImage = images[selectedImageIdx] ?? images[0]

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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', minHeight: '70vh' }}>
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

          <div className="container grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, padding: '40px 24px 48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={() => hasImages && setLightboxOpen(true)}
                aria-label="Ampliar imagen"
                disabled={!hasImages}
                className="product-main-image"
                style={{
                  background: 'white',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  aspectRatio: '4 / 3',
                  position: 'relative',
                  padding: 0,
                  cursor: hasImages ? 'zoom-in' : 'default',
                  width: '100%',
                }}
              >
                <ProductThumb src={mainImage?.urlFull ?? mainImage?.urlMedium} alt={product.name} fit="contain" />
                {product.isNew && (
                  <span className="tag" style={{ position: 'absolute', top: 14, left: 14, background: 'var(--amber-bright)', color: 'var(--ink)' }}>NUEVO</span>
                )}
                {hasImages && (
                  <span
                    aria-hidden="true"
                    className="product-zoom-badge"
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'rgba(20,56,36,0.85)',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '8px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <ZoomIn size={14} /> Ampliar
                  </span>
                )}
              </button>

              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      aria-label={`Foto ${idx + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: `2px solid ${idx === selectedImageIdx ? 'var(--green)' : 'var(--line)'}`,
                        padding: 0,
                        cursor: 'pointer',
                        background: 'white',
                        transition: 'border-color 120ms ease',
                      }}
                    >
                      <img src={img.urlThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 520 }}>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <span className="tag muted">{product.code}</span>
                {product.category && <span className="muted" style={{ fontSize: 13 }}>{product.category.name}</span>}
                {product.partType && <span className="muted" style={{ fontSize: 13 }}>{product.partType.name}</span>}
                {product.brand && <span className="muted" style={{ fontSize: 13 }}>{product.brand.name}</span>}
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
                <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                  <div className="row" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ background: 'transparent', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', display: 'inline-flex' }} aria-label="Menos"><Minus size={16} /></button>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, padding: '0 14px', minWidth: 30, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} style={{ background: 'transparent', border: 'none', padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', display: 'inline-flex' }} aria-label="Más"><Plus size={16} /></button>
                  </div>
                  <button onClick={handleAdd} className="btn primary lg" style={{ flex: '1 1 200px' }}>
                    <ShoppingCart size={18} />
                    {added ? 'Añadido al pedido' : qty > 1 ? `Añadir ${qty} al pedido` : 'Añadir al pedido'}
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
          {lightboxOpen && hasImages && (
            <Lightbox
              images={images.map((img) => ({ src: img.urlFull, alt: product.name }))}
              startIndex={selectedImageIdx}
              onClose={() => setLightboxOpen(false)}
              onIndexChange={setSelectedImageIdx}
            />
          )}
        </main>
      )}
    </div>
  )
}

/** Full-screen image viewer. Esc to close, click backdrop to close, arrow keys
 *  (and on-screen arrows) to navigate. On mobile the image is pinch-zoomable
 *  because touch-action is left at the browser default inside the overlay. */
function Lightbox({
  images,
  startIndex,
  onClose,
  onIndexChange,
}: {
  images: { src: string; alt: string }[]
  startIndex: number
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const hasMany = images.length > 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasMany) setIdx((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft' && hasMany) setIdx((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    // Prevent background scroll while lightbox is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [images.length, hasMany, onClose])

  useEffect(() => { onIndexChange(idx) }, [idx, onIndexChange])

  const current = images[idx]
  if (!current) return null

  // Portal to <body>: the page's `.fade-up` animation leaves a transform on
  // <main>, which would make this position:fixed overlay relative to <main>
  // instead of the viewport (image ends up off-screen on long pages / phones).
  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-label="Vista ampliada"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,18,14,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'clamp(12px, 4vw, 72px)',
        cursor: 'zoom-out',
      }}
    >
      {/* Keyed by index so zoom/pan resets when switching photos. */}
      <ZoomableImage key={idx} src={current.src} alt={current.alt} />

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        <X size={22} />
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length) }}
            aria-label="Anterior"
            style={{
              position: 'fixed',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length) }}
            aria-label="Siguiente"
            style={{
              position: 'fixed',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={24} />
          </button>
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

const MAX_ZOOM = 5
const CLICK_ZOOM = 2.5

/** Image filling the lightbox box, with real zoom: click to zoom into the
 *  clicked point (click again to reset), mouse wheel to zoom in/out, and drag
 *  to pan while zoomed. */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null)
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  /** Keep the zoomed image covering the box so it can't be dragged off-screen. */
  const clamp = (x: number, y: number, s: number) => {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return { x, y }
    const maxX = ((s - 1) * rect.width) / 2
    const maxY = ((s - 1) * rect.height) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }

  /** Pointer position relative to the box centre (the transform origin). */
  const pointFromCenter = (clientX: number, clientY: number) => {
    const rect = boxRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 }
  }

  /** Zoom to `next` while keeping the point under the cursor fixed. */
  const zoomAt = (next: number, clientX: number, clientY: number) => {
    const s = Math.max(1, Math.min(MAX_ZOOM, next))
    if (s === 1) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
      return
    }
    const p = pointFromCenter(clientX, clientY)
    const ratio = s / scale
    setScale(s)
    setOffset(clamp(p.x - (p.x - offset.x) * ratio, p.y - (p.y - offset.y) * ratio, s))
  }

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (drag.current?.moved) return
    if (scale > 1) zoomAt(1, e.clientX, e.clientY)
    else zoomAt(CLICK_ZOOM, e.clientX, e.clientY)
  }

  const onWheel = (e: React.WheelEvent) => {
    zoomAt(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false }
    if (scale > 1) {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || scale <= 1) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    setOffset(clamp(d.ox + dx, d.oy + dy, scale))
  }

  const onPointerUp = () => {
    setDragging(false)
    // Clear after the click event that follows pointerup has seen `moved`.
    setTimeout(() => { drag.current = null }, 0)
  }

  return (
    <div
      ref={boxRef}
      onClick={(e) => e.stopPropagation()}
      onWheel={onWheel}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 8,
        position: 'relative',
        touchAction: scale > 1 ? 'none' : 'manipulation',
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center',
          transition: dragging ? 'none' : 'transform 180ms ease',
          cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
          userSelect: 'none',
        }}
      />
      {scale === 1 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 12,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {isTouch ? 'Toca la imagen para acercar' : 'Haz clic o usa la rueda del mouse para acercar'}
        </div>
      )}
    </div>
  )
}
