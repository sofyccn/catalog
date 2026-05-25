import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Plus, X } from 'lucide-react'
import { WorkerHeader } from '../../components/WorkerHeader'
import { useCategories, type Category, type Product } from '../../api/catalog'
import {
  useAdminProducts,
  useCreateCategory,
  useDeactivateCategory,
  useSaveProduct,
  useToggleProduct,
  type ProductInput,
} from '../../api/admin'
import { getApiErrorMessage } from '../../lib/api'

export default function CatalogManager() {
  const categoriesQ = useCategories()
  const productsQ = useAdminProducts()
  const toggleProduct = useToggleProduct()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const categories = categoriesQ.data ?? []
  const categoriesById = useMemo(() => {
    const m = new Map<string, Category>()
    categories.forEach((c) => m.set(c.id, c))
    return m
  }, [categories])

  const products = productsQ.data?.data ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <WorkerHeader />
      <main className="fade-up">
        <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
          <div className="container" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/admin" className="btn ghost sm">
              <ArrowLeft size={14} /> Panel
            </Link>
            <div style={{ flex: 1 }}>
              <span className="label">Administración</span>
              <h1 style={{ fontSize: 28, marginTop: 2 }}>Catálogo</h1>
            </div>
            <button className="btn primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Nuevo producto
            </button>
          </div>
        </div>

        <div className="container" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, padding: '24px 24px 64px' }}>
          {/* Categories */}
          <CategoriesPanel categories={categories} loading={categoriesQ.isLoading} />

          {/* Products */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <span className="label">Productos ({products.length})</span>
            </div>
            {productsQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : (
              <>
                <div
                  className="label"
                  style={{ display: 'grid', gridTemplateColumns: '110px 1fr 160px 90px 90px', gap: 12, padding: '12px 20px', borderBottom: '1.5px solid var(--line)', background: 'var(--bg-tint)' }}
                >
                  <span>Código</span>
                  <span>Nombre</span>
                  <span>Categoría</span>
                  <span>Estado</span>
                  <span style={{ textAlign: 'right' }}>Acción</span>
                </div>
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: 'grid', gridTemplateColumns: '110px 1fr 160px 90px 90px', gap: 12, padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', opacity: p.active ? 1 : 0.55 }}
                  >
                    <span className="tag muted" style={{ width: 'fit-content' }}>{p.code}</span>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className="muted" style={{ fontSize: 13 }}>{categoriesById.get(p.categoryId)?.name ?? '—'}</span>
                    <span>
                      <button
                        onClick={() => toggleProduct.mutate({ id: p.id, active: !p.active })}
                        className="tag"
                        style={{ cursor: 'pointer', border: 'none', background: p.active ? 'var(--ok-tint)' : 'var(--bg-tint)', color: p.active ? 'var(--ok)' : 'var(--ink-faint)' }}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <button className="btn ghost sm" onClick={() => setEditing(p)} aria-label="Editar">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Aún no hay productos.</div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function CategoriesPanel({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const createCategory = useCreateCategory()
  const deactivateCategory = useDeactivateCategory()
  const [name, setName] = useState('')

  const add = () => {
    if (!name.trim()) return
    createCategory.mutate(name.trim(), { onSuccess: () => setName('') })
  }

  return (
    <div className="card" style={{ padding: 18, alignSelf: 'flex-start' }}>
      <span className="label">Categorías</span>
      <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Nueva categoría"
        />
        <button className="btn primary" onClick={add} disabled={createCategory.isPending} aria-label="Agregar">
          <Plus size={16} />
        </button>
      </div>
      {createCategory.isError && (
        <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{getApiErrorMessage(createCategory.error)}</p>
      )}
      {loading ? (
        <Loader2 className="animate-spin" size={18} style={{ color: 'var(--ink-faint)' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {categories.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 8px', borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>{c.name}</span>
              <button
                onClick={() => deactivateCategory.mutate(c.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'inline-flex' }}
                aria-label="Desactivar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {categories.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Sin categorías.</span>}
        </div>
      )}
    </div>
  )
}

function ProductFormModal({
  product,
  categories,
  onClose,
}: {
  product: Product | null
  categories: Category[]
  onClose: () => void
}) {
  const save = useSaveProduct()
  const [form, setForm] = useState<ProductInput>({
    code: product?.code ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.categoryId ?? categories[0]?.id ?? '',
    active: product?.active ?? true,
  })

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    save.mutate({ id: product?.id, input: form }, { onSuccess: onClose })
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22 }}>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Código">
            <input className="input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="P0001" />
          </Field>
          <Field label="Nombre">
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Descripción">
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
          <Field label="Categoría">
            <select className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {product && (
            <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active ?? true} onChange={(e) => set('active', e.target.checked)} />
              <span style={{ fontSize: 14 }}>Activo (visible en el catálogo)</span>
            </label>
          )}
        </div>
        {save.isError && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{getApiErrorMessage(save.error)}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={submit}
            disabled={save.isPending || !form.code.trim() || !form.name.trim() || !form.categoryId}
          >
            {save.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}
