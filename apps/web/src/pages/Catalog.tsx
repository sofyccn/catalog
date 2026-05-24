import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Loader2, Plus, Search, X } from 'lucide-react'
import { Header } from '../components/Header'
import { ProductThumb } from '../components/ProductThumb'
import { useCategories, useProducts, type Category, type Product } from '../api/catalog'

const PAGE_SIZE = 24

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function Catalog() {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [toast, setToast] = useState<string | null>(null)

  const debouncedQuery = useDebounced(query.trim(), 300)

  const categoriesQ = useCategories()
  const productsQ = useProducts({
    search: debouncedQuery || undefined,
    categoryId: categoryId || undefined,
    page: 1,
    limit,
  })

  // Reset paging whenever the filters change.
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [debouncedQuery, categoryId])

  const categoriesById = useMemo(() => {
    const m = new Map<string, Category>()
    categoriesQ.data?.forEach((c) => m.set(c.id, c))
    return m
  }, [categoriesQ.data])

  const products = productsQ.data?.data ?? []
  const total = productsQ.data?.total ?? 0
  const activeCategory = categoryId ? categoriesById.get(categoryId) : undefined
  const hasFilters = Boolean(debouncedQuery || categoryId)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }
  const onAdd = (p: Product) => showToast(`«${p.name}» — el carrito de revisión llegará pronto`)
  const clearFilters = () => {
    setQuery('')
    setCategoryId(null)
  }

  const categories = categoriesQ.data ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <main className="fade-up">
        {/* Hero */}
        <section style={{ background: 'var(--green-deep)', color: 'white', padding: '48px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <span className="label" style={{ color: 'var(--amber-bright)', letterSpacing: '0.15em' }}>
                  Catálogo 2026
                </span>
                <h1 style={{ fontSize: 52, marginTop: 8, color: 'white' }}>
                  Maquinaria <em style={{ color: 'var(--amber-bright)', fontStyle: 'italic' }}>que aguanta</em>
                  <br />
                  el trabajo del campo.
                </h1>
                <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.78)', fontSize: 17, maxWidth: 540 }}>
                  Busca bombas, motoguadañas, repuestos o lo que necesites. Arma tu pedido aquí y te
                  confirmamos disponibilidad en pocas horas.
                </p>
              </div>
              <HeroSearch
                query={query}
                setQuery={setQuery}
                categories={categories}
                activeCategoryId={categoryId}
                onPickCategory={(id) => setCategoryId((cur) => (cur === id ? null : id))}
              />
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <FilterSearch value={query} onChange={setQuery} />
            <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
            <div style={{ flex: 1 }} />
            <ViewToggle view={view} setView={setView} />
          </div>
        </section>

        {/* Active filter chips */}
        {hasFilters && (
          <section style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-tint)', padding: '10px 0' }}>
            <div className="container" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="label">Filtros activos:</span>
              {debouncedQuery && <RemovableChip onClear={() => setQuery('')}>"{debouncedQuery}"</RemovableChip>}
              {activeCategory && (
                <RemovableChip onClear={() => setCategoryId(null)}>{activeCategory.name}</RemovableChip>
              )}
              <button onClick={clearFilters} className="btn sm subtle" style={{ marginLeft: 'auto' }}>
                Limpiar todo
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        <section style={{ padding: '32px 0 48px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <h2 style={{ fontSize: 24 }}>
                {total} {total === 1 ? 'producto' : 'productos'}
                {debouncedQuery && (
                  <span className="muted" style={{ fontSize: 16, fontWeight: 400, fontStyle: 'italic' }}>
                    {' '}
                    para "{debouncedQuery}"
                  </span>
                )}
              </h2>
              {productsQ.isFetching && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--ink-faint)' }} />}
            </div>

            {productsQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : products.length === 0 ? (
              <EmptyResults onClear={clearFilters} />
            ) : view === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categoryName={categoriesById.get(p.categoryId)?.name}
                    onAdd={onAdd}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    categoryName={categoriesById.get(p.categoryId)?.name}
                    onAdd={onAdd}
                  />
                ))}
              </div>
            )}

            {products.length < total && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <button
                  className="btn ghost"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                  disabled={productsQ.isFetching}
                >
                  Cargar más ({total - products.length} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ink)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

interface HeroSearchProps {
  query: string
  setQuery: (v: string) => void
  categories: Category[]
  activeCategoryId: string | null
  onPickCategory: (id: string) => void
}

function HeroSearch({ query, setQuery, categories, activeCategoryId, onPickCategory }: HeroSearchProps) {
  return (
    <div className="card" style={{ padding: 22, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)' }}>
      <div className="label" style={{ color: 'rgba(255,255,255,0.7)' }}>
        ¿Qué necesitas?
      </div>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto o código…"
        style={{ marginTop: 8, padding: '14px 18px', fontSize: 16, border: 'none', color: 'var(--ink)' }}
      />
      <div style={{ marginTop: 16 }}>
        <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
          Categorías populares
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.slice(0, 6).map((c) => {
            const active = activeCategoryId === c.id
            return (
              <button
                key={c.id}
                onClick={() => onPickCategory(c.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--amber-bright)' : 'rgba(255,255,255,0.12)',
                  color: active ? 'var(--ink)' : 'white',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FilterSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 460 }}>
      <Search
        size={16}
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}
      />
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nombre o código (ej. P0001)"
        style={{ paddingLeft: 38 }}
      />
    </div>
  )
}

interface CategorySelectProps {
  categories: Category[]
  value: string | null
  onChange: (id: string | null) => void
}

function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  return (
    <select
      className="btn ghost"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{ minWidth: 200 }}
    >
      <option value="">Todas las categorías</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

function ViewToggle({ view, setView }: { view: 'list' | 'grid'; setView: (v: 'list' | 'grid') => void }) {
  const items: Array<'list' | 'grid'> = ['list', 'grid']
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-tint)', borderRadius: 999, padding: 4 }}>
      {items.map((v) => {
        const Icon = v === 'list' ? List : LayoutGrid
        const active = view === v
        return (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-label={v === 'list' ? 'Vista de lista' : 'Vista de cuadrícula'}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              background: active ? 'white' : 'transparent',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}

function RemovableChip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="chip" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      {children}
      <button
        onClick={onClear}
        style={{ background: 'none', border: 'none', padding: 0, marginLeft: 4, cursor: 'pointer', color: 'var(--ink-faint)', display: 'inline-flex' }}
      >
        <X size={12} />
      </button>
    </span>
  )
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🌾</div>
      <h3 style={{ fontSize: 22, marginBottom: 8 }}>No encontramos productos</h3>
      <p className="muted" style={{ marginBottom: 16 }}>Prueba con otra palabra o limpia los filtros.</p>
      <button className="btn primary" onClick={onClear}>
        Ver todos los productos
      </button>
    </div>
  )
}

interface ProductItemProps {
  product: Product
  categoryName?: string | undefined
  onAdd: (p: Product) => void
}

function ProductRow({ product, categoryName, onAdd }: ProductItemProps) {
  return (
    <div
      className="card"
      style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 24, padding: 18, alignItems: 'center' }}
    >
      <div style={{ width: 160, height: 120, borderRadius: 12, overflow: 'hidden' }}>
        <ProductThumb src={product.images?.[0]?.urlThumb} alt={product.name} />
      </div>
      <div>
        <div className="row" style={{ gap: 10, marginBottom: 4 }}>
          <span className="tag muted">{product.code}</span>
          {categoryName && <span className="muted" style={{ fontSize: 13 }}>{categoryName}</span>}
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 6 }}>{product.name}</h3>
        {product.description && (
          <p className="muted" style={{ fontSize: 14, maxWidth: 560 }}>
            {product.description}
          </p>
        )}
      </div>
      <button onClick={() => onAdd(product)} className="btn primary" style={{ padding: '12px 22px' }}>
        <Plus size={16} /> Añadir
      </button>
    </div>
  )
}

function ProductCard({ product, categoryName, onAdd }: ProductItemProps) {
  return (
    <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden' }}>
        <ProductThumb src={product.images?.[0]?.urlThumb} alt={product.name} />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="tag muted">{product.code}</span>
        {categoryName && <span className="muted" style={{ fontSize: 12 }}>{categoryName}</span>}
      </div>
      <h3 style={{ fontSize: 16 }}>{product.name}</h3>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'auto' }}>
        <button onClick={() => onAdd(product)} className="btn sm primary">
          <Plus size={14} /> Añadir
        </button>
      </div>
    </div>
  )
}
