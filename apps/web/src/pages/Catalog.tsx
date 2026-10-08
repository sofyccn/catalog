import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Filter, Loader2, Plus, Search, X } from 'lucide-react'
import { Header } from '../components/Header'
import { ProductThumb } from '../components/ProductThumb'
import {
  formatPrice,
  useProducts,
  type Facet,
  type Product,
  type ProductQuery,
} from '../api/catalog'
import { useCart } from '../stores/cart'

const PAGE_SIZE = 24

type ProductMode = 'all' | 'machines' | 'parts'

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function Catalog() {
  const navigate = useNavigate()
  const addToCart = useCart((s) => s.add)

  // Filters live in the URL (?q=&tipo=&marca=&min=&max=&nuevos=&n=) so going back
  // from a product restores the same list, and a filtered list can be shared.
  const [searchParams, setSearchParams] = useSearchParams()
  const debouncedQuery = searchParams.get('q') ?? ''
  // Top-level toggle: every product is either a complete machine or a spare part.
  const tipo = searchParams.get('tipo')
  const productMode: ProductMode = tipo === 'machines' || tipo === 'parts' ? tipo : 'all'
  const brandIds = searchParams.getAll('marca')
  const minPrice = searchParams.get('min') ?? ''
  const maxPrice = searchParams.get('max') ?? ''
  const isNew = searchParams.get('nuevos') === '1'
  const limit = Math.max(PAGE_SIZE, Number(searchParams.get('n')) || PAGE_SIZE)

  /** Apply filter changes to the URL. Any filter change resets paging (drops `n`). */
  const updateParams = (changes: Record<string, string | string[] | null>, keepPaging = false) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key)
          if (Array.isArray(value)) value.forEach((v) => next.append(key, v))
          else if (value) next.set(key, value)
        }
        if (!keepPaging) next.delete('n')
        return next
      },
      { replace: true },
    )
  }
  const setProductMode = (mode: ProductMode) => updateParams({ tipo: mode === 'all' ? null : mode })
  const setMinPrice = (v: string) => updateParams({ min: v || null })
  const setMaxPrice = (v: string) => updateParams({ max: v || null })
  const setIsNew = (v: boolean) => updateParams({ nuevos: v ? '1' : null })

  // The search box is typed into locally and committed to the URL once the user pauses.
  const [query, setQueryInput] = useState(debouncedQuery)
  const typedQuery = useDebounced(query.trim(), 300)
  useEffect(() => {
    if (typedQuery !== (searchParams.get('q') ?? '')) updateParams({ q: typedQuery || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedQuery])
  const setQuery = (v: string) => {
    setQueryInput(v)
    if (!v) updateParams({ q: null })
  }

  const [toast, setToast] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const params: ProductQuery = {
    q: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
    brandId: brandIds.length ? brandIds : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    isNew: isNew || undefined,
    isCompleteUnit: productMode === 'machines' ? 'true' : productMode === 'parts' ? 'false' : undefined,
    page: 1,
    limit,
  }
  const productsQ = useProducts(params)

  const data = productsQ.data
  const products = data?.data ?? []
  const total = data?.total ?? 0
  const facets = data?.facets

  const onAdd = (p: Product) => {
    addToCart({ productId: p.id, code: p.code, name: p.name, image: p.images?.[0]?.urlThumb, price: p.price ?? undefined })
    setToast(`«${p.name}» añadido al carrito`)
    setTimeout(() => setToast(null), 2200)
  }

  const toggleBrand = (id: string | null) => {
    if (!id) return
    updateParams({ marca: brandIds.includes(id) ? brandIds.filter((b) => b !== id) : [...brandIds, id] })
  }
  const clearAll = () => {
    setQueryInput('')
    setSearchParams({}, { replace: true })
  }
  const hasFilters =
    !!debouncedQuery || productMode !== 'all' || brandIds.length > 0 || !!minPrice || !!maxPrice || isNew
  const activeFilterCount =
    (debouncedQuery ? 1 : 0) +
    (productMode !== 'all' ? 1 : 0) +
    brandIds.length +
    (minPrice || maxPrice ? 1 : 0) +
    (isNew ? 1 : 0)

  const facetName = (list: Facet[] | undefined, id: string | null) => list?.find((f) => f.id === id)?.name

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <main className="fade-up">
        {/* Hero */}
        <section style={{ background: 'var(--green-deep)', color: 'white', padding: '40px 0' }}>
          <div className="container">
            <span className="label" style={{ color: 'var(--amber-bright)', letterSpacing: '0.15em' }}>
              Importadora Cobo
            </span>
            <h1 style={{ fontSize: 44, marginTop: 8, color: 'white' }}>
              El amigo del agricultor
            </h1>
            <div style={{ position: 'relative', maxWidth: 560, marginTop: 16 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código, nombre o modelo (ej. carburador MS660)"
                style={{ paddingLeft: 44, paddingTop: 14, paddingBottom: 14, fontSize: 16, color: 'var(--ink)' }}
              />
            </div>
          </div>
        </section>

        <div className="container catalog-grid grid-sidebar" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, padding: '24px 24px 64px', alignItems: 'start' }}>
          <button
            type="button"
            className="catalog-filters-toggle btn ghost"
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter size={16} />
            {showFilters ? 'Ocultar filtros' : 'Filtros'}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>

          {/* Filters sidebar */}
          <aside
            className={`sticky-aside catalog-aside ${showFilters ? 'catalog-aside--open' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 88 }}
          >
            {/* Primary toggle: machines vs spare parts */}
            <div className="card product-mode" style={{ padding: 4, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {(
                [
                  ['all', 'Todos'],
                  ['machines', 'Máquinas'],
                  ['parts', 'Repuestos'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setProductMode(val)}
                  className={`product-mode__btn ${productMode === val ? 'is-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <FacetSection title="Marca">
              <FacetList facets={facets?.brands} selected={brandIds} onToggle={toggleBrand} multi />
            </FacetSection>

            <FacetSection title="Precio (USD)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="input" type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={facets ? String(Math.floor(facets.priceRange.min)) : 'mín'} />
                <span className="faint">a</span>
                <input className="input" type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={facets ? String(Math.ceil(facets.priceRange.max)) : 'máx'} />
              </div>
            </FacetSection>

            <label className="row" style={{ gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              Solo productos nuevos
            </label>

            {hasFilters && (
              <button className="btn ghost sm" onClick={clearAll}>
                Limpiar filtros
              </button>
            )}
          </aside>

          {/* Results */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22 }}>
                {total} {total === 1 ? 'producto' : 'productos'}
                {productsQ.isFetching && <Loader2 className="animate-spin" size={16} style={{ color: 'var(--ink-faint)', marginLeft: 10, verticalAlign: 'middle' }} />}
              </h2>
            </div>

            {/* Active chips */}
            {hasFilters && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {debouncedQuery && <Chip onClear={() => setQuery('')}>"{debouncedQuery}"</Chip>}
                {productMode !== 'all' && (
                  <Chip onClear={() => setProductMode('all')}>{productMode === 'machines' ? 'Máquinas' : 'Repuestos'}</Chip>
                )}
                {brandIds.map((b) => (
                  <Chip key={b} onClear={() => toggleBrand(b)}>{facetName(facets?.brands, b) ?? 'Marca'}</Chip>
                ))}
                {(minPrice || maxPrice) && (
                  <Chip onClear={() => { setMinPrice(''); setMaxPrice('') }}>
                    {minPrice && maxPrice ? `$${minPrice} a $${maxPrice}` : minPrice ? `Desde $${minPrice}` : `Hasta $${maxPrice}`}
                  </Chip>
                )}
                {isNew && <Chip onClear={() => setIsNew(false)}>Nuevos</Chip>}
              </div>
            )}

            {productsQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : products.length === 0 ? (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>No encontramos productos</h3>
                <button className="btn primary" onClick={clearAll}>Limpiar filtros</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={onAdd} onOpen={() => navigate(`/producto/${p.id}`)} />
                ))}
              </div>
            )}

            {products.length < total && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <button className="btn ghost" onClick={() => updateParams({ n: String(limit + PAGE_SIZE) }, true)} disabled={productsQ.isFetching}>
                  Cargar más ({total - products.length} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'white', padding: '12px 20px', borderRadius: 999, fontSize: 14, fontWeight: 500, boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function FacetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function FacetList({ facets, selected, onToggle, multi }: { facets?: Facet[]; selected: string[]; onToggle: (id: string | null) => void; multi?: boolean }) {
  if (!facets || facets.length === 0) return <span className="faint" style={{ fontSize: 13 }}>Sin opciones</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
      {facets.map((f) => {
        const active = f.id !== null && selected.includes(f.id)
        return (
          <button
            key={f.id ?? '__null'}
            onClick={() => onToggle(f.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              background: active ? 'var(--green-tint)' : 'transparent',
              fontSize: 14,
              color: 'var(--ink)',
            }}
          >
            {multi && (
              <span style={{ width: 15, height: 15, borderRadius: 4, border: '1.5px solid ' + (active ? 'var(--green)' : 'var(--line)'), background: active ? 'var(--green)' : 'white', flexShrink: 0 }} />
            )}
            <span style={{ flex: 1 }}>{f.name}</span>
            <span className="faint" style={{ fontSize: 12 }}>{f.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="chip" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      {children}
      <button onClick={onClear} style={{ background: 'none', border: 'none', padding: 0, marginLeft: 4, cursor: 'pointer', color: 'var(--ink-faint)', display: 'inline-flex' }}>
        <X size={12} />
      </button>
    </span>
  )
}

interface ItemProps {
  product: Product
  onAdd: (p: Product) => void
  onOpen: () => void
}

function NewBadge() {
  return (
    <span className="tag" style={{ background: 'var(--amber-bright)', color: 'var(--ink)', fontSize: 10 }}>NUEVO</span>
  )
}

function ProductCard({ product, onAdd, onOpen }: ItemProps) {
  return (
    <div onClick={onOpen} className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
      <div style={{ aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
        <ProductThumb src={product.images?.[0]?.urlThumb} alt={product.name} />
        {product.isNew && <span style={{ position: 'absolute', top: 8, left: 8 }}><NewBadge /></span>}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="tag muted">{product.code}</span>
        {product.brand && <span className="muted" style={{ fontSize: 12 }}>{product.brand.name}</span>}
      </div>
      <h3 style={{ fontSize: 15, lineHeight: 1.25 }}>{product.name}</h3>
      {product.compatibleModels && product.compatibleModels.length > 0 && (
        <div className="faint" style={{ fontSize: 11 }}>Compatible: {product.compatibleModels.map((m) => m.model.code).slice(0, 3).join(', ')}</div>
      )}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{formatPrice(product.price)}</span>
        <button onClick={(e) => { e.stopPropagation(); onAdd(product) }} className="btn sm primary">
          <Plus size={14} /> Añadir
        </button>
      </div>
    </div>
  )
}
