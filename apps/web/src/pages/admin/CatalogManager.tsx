import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Loader2, Pencil, Plus, X } from 'lucide-react'
import { WorkerHeader } from '../../components/WorkerHeader'
import { ProductThumb } from '../../components/ProductThumb'
import {
  formatPrice,
  useBrands,
  useCategories,
  useEquipmentModels,
  usePartTypes,
  useProduct,
  type Category,
  type Product,
} from '../../api/catalog'
import {
  useAdminProducts,
  useCreateCategory,
  useDeactivateCategory,
  useDeleteImage,
  useSaveProduct,
  useToggleProduct,
  useUploadImages,
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
            <Link to="/admin" className="btn ghost">
              <ArrowLeft size={16} /> Volver al panel
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

        <div className="container grid-sidebar" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, padding: '24px 24px 64px' }}>
          <CategoriesPanel categories={categories} loading={categoriesQ.isLoading} />

          <div className="card admin-products" style={{ padding: 0, alignSelf: 'flex-start' }}>
            <div className="admin-products__head">
              <span className="label">Productos ({products.length})</span>
            </div>
            {productsQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Aún no hay productos.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="admin-row" style={{ opacity: p.active ? 1 : 0.55 }}>
                  <div className="admin-row__thumb">
                    <ProductThumb src={p.images?.[0]?.urlThumb} alt={p.name} />
                  </div>
                  <div className="admin-row__main">
                    <div className="admin-row__top">
                      <span className="tag muted">{p.code}</span>
                      {p.brand && <span className="muted" style={{ fontSize: 12 }}>{p.brand.name}</span>}
                      {p.isNew && (
                        <span className="tag" style={{ background: 'var(--amber-bright)', color: 'var(--ink)', fontSize: 10 }}>NUEVO</span>
                      )}
                    </div>
                    <div className="admin-row__name">{p.name}</div>
                    <div className="admin-row__meta">
                      {categoriesById.get(p.categoryId)?.name ?? '—'}
                      {p.partType && ` · ${p.partType.name}`}
                    </div>
                  </div>
                  <div className="admin-row__price">{formatPrice(p.price)}</div>
                  <div className="admin-row__actions">
                    <button
                      type="button"
                      onClick={() => toggleProduct.mutate({ id: p.id, active: !p.active })}
                      className="tag"
                      style={{ cursor: 'pointer', border: 'none', background: p.active ? 'var(--ok-tint)' : 'var(--bg-tint)', color: p.active ? 'var(--ok)' : 'var(--ink-faint)' }}
                    >
                      {p.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button className="btn ghost sm" onClick={() => setEditing(p)} aria-label="Editar">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {editing && (
        <ProductFormModal product={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} />
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
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Nueva categoría" />
        <button className="btn primary" onClick={add} disabled={createCategory.isPending} aria-label="Agregar"><Plus size={16} /></button>
      </div>
      {createCategory.isError && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{getApiErrorMessage(createCategory.error)}</p>}
      {loading ? (
        <Loader2 className="animate-spin" size={18} style={{ color: 'var(--ink-faint)' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {categories.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 8px', borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>{c.name}</span>
              <button onClick={() => deactivateCategory.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'inline-flex' }} aria-label="Desactivar"><X size={14} /></button>
            </div>
          ))}
          {categories.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Sin categorías.</span>}
        </div>
      )}
    </div>
  )
}

function ProductFormModal({ product, categories, onClose }: { product: Product | null; categories: Category[]; onClose: () => void }) {
  const save = useSaveProduct()
  const partTypes = usePartTypes()
  const brands = useBrands()

  const [code, setCode] = useState(product?.code ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [partTypeId, setPartTypeId] = useState(product?.partType?.id ?? '')
  const [brandId, setBrandId] = useState(product?.brand?.id ?? '')
  const [isCompleteUnit, setIsCompleteUnit] = useState(product?.isCompleteUnit ?? false)
  const [isNew, setIsNew] = useState(product?.isNew ?? false)
  const [active, setActive] = useState(product?.active ?? true)
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])

  const models = useEquipmentModels(categoryId || undefined)

  // Prefill selected models (match the product's compatible codes once models load).
  const [modelsInit, setModelsInit] = useState(false)
  useEffect(() => {
    if (!modelsInit && product && models.data) {
      const codes = new Set((product.compatibleModels ?? []).map((cm) => cm.model.code))
      setSelectedModelIds(models.data.filter((m) => codes.has(m.code)).map((m) => m.id))
      setModelsInit(true)
    }
  }, [modelsInit, product, models.data])

  const toggleModel = (id: string) =>
    setSelectedModelIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const submit = () => {
    const input: ProductInput = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      price: price ? Number(price) : 0,
      categoryId,
      partTypeId: partTypeId || null,
      brandId: brandId || null,
      isCompleteUnit,
      isNew,
      active,
      modelIds: selectedModelIds,
    }
    save.mutate({ id: product?.id, input }, { onSuccess: onClose })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,25,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: 20, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 520, padding: 24, margin: '24px 0' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22 }}>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Código"><input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="E55" /></Field>
            <Field label="Precio (USD)"><input className="input" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></Field>
          </div>
          <Field label="Nombre"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Descripción"><textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Categoría">
              <select className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSelectedModelIds([]) }}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tipo de parte">
              <select className="input" value={partTypeId} onChange={(e) => setPartTypeId(e.target.value)}>
                <option value="">— Ninguno —</option>
                {partTypes.data?.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Marca">
            <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">Genérico / Sin marca</option>
              {brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>

          <Field label="Modelos compatibles">
            {models.data && models.data.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                {models.data.map((m) => {
                  const on = selectedModelIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleModel(m.id)} className={`chip ${on ? 'active' : ''}`} style={!on ? { border: '1px solid var(--line)' } : undefined}>
                      {m.code}
                    </button>
                  )
                })}
              </div>
            ) : (
              <span className="faint" style={{ fontSize: 13 }}>No hay modelos para esta categoría.</span>
            )}
          </Field>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <label className="row" style={{ gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={isCompleteUnit} onChange={(e) => setIsCompleteUnit(e.target.checked)} /> Equipo completo</label>
            <label className="row" style={{ gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> Nuevo</label>
            <label className="row" style={{ gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo</label>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Imágenes</div>
            {product ? (
              <ImagesEditor productId={product.id} />
            ) : (
              <p className="muted" style={{ fontSize: 12 }}>Guarda el producto primero para poder subir imágenes.</p>
            )}
          </div>
        </div>

        {save.isError && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{getApiErrorMessage(save.error)}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={save.isPending || !code.trim() || !name.trim() || !categoryId}>
            {save.isPending ? <Loader2 className="animate-spin" size={16} /> : null} Guardar
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

function ImagesEditor({ productId }: { productId: string }) {
  const detail = useProduct(productId)
  const uploadImages = useUploadImages(productId)
  const deleteImage = useDeleteImage(productId)
  const images = detail.data?.images ?? []

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length) uploadImages.mutate(files)
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
            <img src={img.urlThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => deleteImage.mutate(img.id)}
              aria-label="Eliminar imagen"
              style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <label style={{ width: 72, height: 72, borderRadius: 8, border: '1.5px dashed var(--line)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-faint)', gap: 2 }}>
          {uploadImages.isPending ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
          <span style={{ fontSize: 10 }}>Subir</span>
          <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: 'none' }} />
        </label>
      </div>
      {uploadImages.isError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{getApiErrorMessage(uploadImages.error)}</p>}
    </div>
  )
}
