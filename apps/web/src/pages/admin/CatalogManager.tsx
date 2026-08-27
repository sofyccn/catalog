import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Plus, Search, UploadCloud, X } from 'lucide-react'
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
  useDeleteImage,
  useSaveProduct,
  useToggleProduct,
  useUploadImages,
  useUploadImagesFromUrls,
  type ProductInput,
} from '../../api/admin'
import { getApiErrorMessage } from '../../lib/api'

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function CatalogManager() {
  const categoriesQ = useCategories()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search.trim(), 300)
  const productsQ = useAdminProducts(debouncedSearch.length >= 2 ? debouncedSearch : undefined)
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

        <div className="container" style={{ padding: '24px 24px 64px' }}>
          <div className="card admin-products" style={{ padding: 0, alignSelf: 'flex-start' }}>
            <div className="admin-products__head" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span className="label" style={{ flexShrink: 0 }}>
                Productos ({productsQ.data?.total ?? 0}
                {debouncedSearch && productsQ.data ? ` · mostrando ${products.length}` : ''})
              </span>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }}
                />
                <input
                  className="input"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o código (ej. carburador, MS660, AFS55)"
                  style={{ paddingLeft: 36, fontSize: 14 }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpiar búsqueda"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-faint)',
                      display: 'inline-flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {productsQ.isFetching && !productsQ.isLoading && (
                <Loader2 className="animate-spin" size={16} style={{ color: 'var(--ink-faint)' }} />
              )}
            </div>
            {productsQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
                {debouncedSearch
                  ? `No hay productos que contengan "${debouncedSearch}".`
                  : 'Aún no hay productos.'}
              </div>
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
            <div className="label" style={{ marginBottom: 6 }}>Imágenes del producto</div>
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

/** Pull every <img src> out of a clipboard text/html payload, in order. */
function extractImageSources(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('img'))
    .map((img) => img.getAttribute('src')?.trim() ?? '')
    .filter(Boolean)
}

/** Turn a `data:image/png;base64,…` clipboard source into an uploadable File. */
function fileFromDataUrl(dataUrl: string): File | null {
  const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.*)$/)
  const mime = match?.[1]
  const base64 = match?.[2]
  if (!mime || !base64) return null
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new File([bytes], `pegada-${Date.now()}.${mime.split('/')[1] ?? 'png'}`, { type: mime })
  } catch {
    return null
  }
}

function ImagesEditor({ productId }: { productId: string }) {
  const detail = useProduct(productId)
  const uploadImages = useUploadImages(productId)
  const uploadFromUrls = useUploadImagesFromUrls(productId)
  const deleteImage = useDeleteImage(productId)
  const images = detail.data?.images ?? []
  const [dragOver, setDragOver] = useState(false)
  const [pasteHint, setPasteHint] = useState<string | null>(null)
  const busy = uploadImages.isPending || uploadFromUrls.isPending

  const uploadFiles = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'))
    if (imgs.length) uploadImages.mutate(imgs)
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length) uploadFiles(files)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setPasteHint(null)

    // Dragging a file from the explorer: real File objects.
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length) {
      uploadFiles(files)
      return
    }

    // Dragging an image out of another browser tab (Canva, Google Images…):
    // no file, just the image's address. Same handling as a paste.
    const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    const html = e.dataTransfer.getData('text/html')
    const sources = [
      ...uriList.split(/[\r\n]+/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')),
      ...(html ? extractImageSources(html) : []),
    ]

    const dataUrls = sources.filter((s) => s.startsWith('data:image/'))
    if (dataUrls.length) {
      uploadFiles(dataUrls.map(fileFromDataUrl).filter((f): f is File => f !== null))
      return
    }
    const remote = sources.filter((s) => /^https?:/i.test(s))
    if (remote.length) {
      uploadFromUrls.mutate(remote.slice(0, 5))
      return
    }
    if (sources.length) {
      setPasteHint('No se pudo leer esa imagen. Descárgala a tu ordenador y arrástrala desde ahí.')
    }
  }

  // Global paste handler: whenever the images editor is on screen, listen for
  // Ctrl/Cmd+V and pull images out of the clipboard. Only prevents default when
  // we actually find something, so pasting text into inputs still works.
  //
  // Three shapes of clipboard content, in order of preference:
  //  1. A real bitmap (screenshots, Word/PowerPoint desktop, "Copiar imagen"
  //     in a browser) — arrives as a file item we can upload directly.
  //  2. Only text/html with an <img> — what Canva, Google Docs and Word Online
  //     put on the clipboard. data: URLs we decode locally; http(s) URLs go to
  //     the API, which downloads them server-side (the CDN would block us).
  //  3. text/html whose <img> points at file:/// — Word desktop on Windows
  //     sometimes does this. The browser can't read local files, so we say so.
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const data = e.clipboardData
      const files: File[] = []
      if (data) {
        for (const item of Array.from(data.items)) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const f = item.getAsFile()
            if (f) files.push(f)
          }
        }
      }
      if (files.length) {
        e.preventDefault()
        setPasteHint(null)
        uploadFiles(files)
        return
      }

      // The edit modal is full of text inputs, so the paste almost always lands
      // on one of them. That must not stop us from reading an image out of the
      // clipboard — these inputs can't hold an image anyway — but it does mean
      // we can't treat bare text as a URL, or pasting a link into a field would
      // upload it as a photo.
      const target = e.target as HTMLElement | null
      const inTextField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      const html = data?.getData('text/html') ?? ''
      const sources = html ? extractImageSources(html) : []
      if (!sources.length && !inTextField) {
        // A bare URL copied from the address bar counts too.
        const plain = (data?.getData('text/plain') ?? '').trim()
        if (/^https?:\/\/\S+$/i.test(plain)) sources.push(plain)
      }

      if (sources.length) {
        const dataUrls = sources.filter((s) => s.startsWith('data:image/'))
        const remote = sources.filter((s) => /^https?:/i.test(s))
        if (dataUrls.length) {
          e.preventDefault()
          setPasteHint(null)
          uploadFiles(dataUrls.map(fileFromDataUrl).filter((f): f is File => f !== null))
          return
        }
        if (remote.length) {
          e.preventDefault()
          setPasteHint(null)
          uploadFromUrls.mutate(remote.slice(0, 5))
          return
        }
        // Left over: file:/// (Word desktop links to a local temp file) and
        // blob: (Canva sometimes does this) — neither is readable from a web
        // page, so tell the user what does work instead of failing silently.
        setPasteHint(`No se pudo leer esa imagen del portapapeles (origen: ${sources[0]?.slice(0, 24)}…). Descárgala y arrástrala aquí.`)
        return
      }

      if (inTextField) return

      // Nothing usable in the event itself. Leave a breadcrumb naming what the
      // clipboard actually carried — otherwise a failed paste is invisible.
      if (data?.types.length) {
        setPasteHint(`No se encontró ninguna imagen en lo copiado (el portapapeles trae: ${data.types.join(', ')}).`)
      }

      // Last resort: some apps (LibreOffice, certain Word builds) hide the
      // bitmap from the paste event but expose it via the async Clipboard API.
      if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') return
      try {
        const clipItems = await navigator.clipboard.read()
        const fallback: File[] = []
        for (const item of clipItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type)
              fallback.push(new File([blob], `pegada-${Date.now()}.${type.split('/')[1] ?? 'png'}`, { type }))
            }
          }
        }
        if (fallback.length) {
          setPasteHint(null)
          uploadFiles(fallback)
        }
      } catch {
        // Permission denied or unsupported — nothing to do.
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Existing images grid (only shown when there are images) */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative', width: 82, height: 82, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <img src={img.urlThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => deleteImage.mutate(img.id)}
                aria-label="Eliminar imagen"
                style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.65)', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Big drop zone — always visible so drag-and-drop feels obvious */}
      <label
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '28px 20px',
          borderRadius: 14,
          border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--line)'}`,
          background: dragOver ? 'var(--green-tint)' : 'var(--bg-tint)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 120ms ease, background 120ms ease',
        }}
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={28} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Subiendo…</span>
          </>
        ) : (
          <>
            <UploadCloud size={30} style={{ color: 'var(--green)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {dragOver ? 'Suelta la imagen aquí' : 'Arrastra imágenes aquí'}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                o click para elegir · puedes subir varias a la vez
              </div>
            </div>
            <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: 'none' }} />
          </>
        )}
      </label>

      <p className="faint" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>
        <b>Tip:</b> también puedes pegar (<code style={{ fontSize: 11 }}>Ctrl+V</code>) imágenes copiadas desde
        <b> Canva</b>, <b>Word</b>, <b>Google Docs</b> o una captura de pantalla.
        También puedes <b>arrastrar</b> la imagen directamente desde otra pestaña (Canva, Google Imágenes…) o desde una carpeta.
        Lo que no funciona es copiar-pegar un archivo desde el explorador — el navegador no lo permite.
      </p>
      {pasteHint && <p style={{ color: 'var(--ink)', fontSize: 12, marginTop: 6 }}>{pasteHint}</p>}
      {uploadImages.isError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{getApiErrorMessage(uploadImages.error)}</p>}
      {uploadFromUrls.isError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{getApiErrorMessage(uploadFromUrls.error)}</p>}
    </div>
  )
}
