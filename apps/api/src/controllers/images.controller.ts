import type { Request, Response } from 'express'
import dns from 'node:dns/promises'
import net from 'node:net'
import sharp from 'sharp'
import { prisma } from '../lib/prisma.js'
import { badRequest, notFound } from '../lib/errors.js'
import { deleteObject, keyFromUrl, r2Configured, uploadObject } from '../lib/r2.js'

const SIZES = [
  { name: 'thumb', w: 200, h: 200, fit: 'cover' as const, q: 80 },
  { name: 'medium', w: 600, h: 600, fit: 'cover' as const, q: 85 },
  { name: 'full', w: 1200, h: 1200, fit: 'inside' as const, q: 90 },
]

const MAX_REMOTE_BYTES = 8 * 1024 * 1024 // same ceiling as the multipart upload
const MAX_REMOTE_IMAGES = 5

/**
 * Crop a uniform (white or transparent) border off the source.
 *
 * Pasting from Word/Canva hands us the picture sitting on a chunk of blank
 * page, so the padding is baked into the bitmap — the grid then renders it as
 * a small photo floating in white. Real photographs have noisy edges and are
 * left untouched, so this is a no-op for anything dragged in from a camera.
 */
async function trimBlankBorder(source: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(source).metadata()
    // Canva pads with transparency rather than white. Flattening onto white
    // first lets one trim pass handle both, and matches how the catalog renders
    // these anyway (the image tiles sit on a white card).
    const flattened = meta.hasAlpha
      ? await sharp(source).flatten({ background: '#ffffff' }).toBuffer()
      : source
    // The blank area is usually to the right/below the picture, so the
    // top-left pixel sharp samples by default is the photo itself — the
    // background has to be named explicitly or nothing gets cropped.
    const trimmed = await sharp(flattened).trim({ background: '#ffffff', threshold: 12 }).toBuffer()
    // A near-blank image can trim away to almost nothing; keep the original.
    const out = await sharp(trimmed).metadata()
    if (!out.width || !out.height || out.width < 32 || out.height < 32) return source
    return trimmed
  } catch {
    return source
  }
}

/** Resize + store one source buffer in all sizes and persist the row. */
async function storeImage(productId: string, rawSource: Buffer, position: number) {
  const source = await trimBlankBorder(rawSource)
  const base = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const urls: Record<string, string> = {}
  for (const s of SIZES) {
    const buf = await sharp(source).rotate().resize(s.w, s.h, { fit: s.fit }).webp({ quality: s.q }).toBuffer()
    urls[s.name] = await uploadObject(`${base}-${s.name}.webp`, buf, 'image/webp')
  }
  return prisma.productImage.create({
    data: {
      productId,
      urlThumb: urls.thumb!,
      urlMedium: urls.medium!,
      urlFull: urls.full!,
      position,
    },
  })
}

/** Shared preamble for both upload paths: R2 up, product exists, next position. */
async function prepareUpload(id: unknown) {
  if (!r2Configured()) throw badRequest('El almacenamiento de imágenes (R2) no está configurado')
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw notFound('Producto no encontrado')
  const agg = await prisma.productImage.aggregate({ where: { productId: id }, _max: { position: true } })
  return { productId: id, nextPosition: (agg._max.position ?? -1) + 1 }
}

export async function uploadImages(req: Request, res: Response) {
  const { productId, nextPosition } = await prepareUpload(req.params.id)

  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (files.length === 0) throw badRequest('No se recibió ninguna imagen')

  let position = nextPosition
  const created = []
  for (const file of files) {
    created.push(await storeImage(productId, file.buffer, position++))
  }
  res.status(201).json({ images: created })
}

/**
 * Reject URLs that resolve to loopback/private/link-local addresses so an admin
 * pasting a crafted URL can't make the API fetch internal services (SSRF).
 */
async function assertPublicHttpUrl(raw: string) {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw badRequest('La dirección de la imagen no es válida')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw badRequest('Solo se pueden descargar imágenes desde direcciones http(s)')
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = net.isIP(hostname)
    ? [{ address: hostname }]
    : await dns.lookup(hostname, { all: true }).catch(() => {
        throw badRequest('No se pudo resolver la dirección de la imagen')
      })
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) throw badRequest('Esa dirección de imagen no está permitida')
  }
  return url
}

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a = 0, b = 0] = ip.split('.').map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }
  const v6 = ip.toLowerCase()
  if (v6 === '::' || v6 === '::1') return true
  if (v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')) return true
  // IPv4-mapped (::ffff:10.0.0.1)
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return mapped?.[1] ? isPrivateAddress(mapped[1]) : false
}

/**
 * Ingest images the browser could only give us as URLs — e.g. pasting from
 * Canva or Google Docs, where the clipboard carries HTML with a remote <img>
 * instead of a bitmap. Downloading server-side also sidesteps CORS.
 */
export async function uploadImagesFromUrls(req: Request, res: Response) {
  const { productId, nextPosition } = await prepareUpload(req.params.id)

  const body = req.body as { urls?: unknown }
  const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === 'string') : []
  if (urls.length === 0) throw badRequest('No se recibió ninguna imagen')
  if (urls.length > MAX_REMOTE_IMAGES) throw badRequest(`Máximo ${MAX_REMOTE_IMAGES} imágenes a la vez`)

  let position = nextPosition
  const created = []
  for (const raw of urls) {
    const url = await assertPublicHttpUrl(raw)
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    }).catch(() => {
      throw badRequest('No se pudo descargar la imagen desde esa dirección')
    })
    if (!response.ok) throw badRequest('No se pudo descargar la imagen desde esa dirección')

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) throw badRequest('La dirección no apunta a una imagen')

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0) throw badRequest('La imagen descargada está vacía')
    if (buffer.byteLength > MAX_REMOTE_BYTES) throw badRequest('La imagen pesa más de 8 MB')

    created.push(await storeImage(productId, buffer, position++))
  }
  res.status(201).json({ images: created })
}

export async function deleteImage(req: Request, res: Response) {
  const id = req.params.id
  const imageId = req.params.imageId
  if (typeof id !== 'string' || typeof imageId !== 'string') throw notFound('No encontrado')
  const img = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } })
  if (!img) throw notFound('Imagen no encontrada')

  // Best-effort cleanup from R2 (don't fail the request if the object is already gone).
  for (const url of [img.urlThumb, img.urlMedium, img.urlFull]) {
    const key = keyFromUrl(url)
    if (key) await deleteObject(key).catch(() => {})
  }
  await prisma.productImage.delete({ where: { id: imageId } })
  res.status(204).end()
}
