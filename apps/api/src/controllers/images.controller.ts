import type { Request, Response } from 'express'
import sharp from 'sharp'
import { prisma } from '../lib/prisma.js'
import { badRequest, notFound } from '../lib/errors.js'
import { deleteObject, keyFromUrl, r2Configured, uploadObject } from '../lib/r2.js'

const SIZES = [
  { name: 'thumb', w: 200, h: 200, fit: 'cover' as const, q: 80 },
  { name: 'medium', w: 600, h: 600, fit: 'cover' as const, q: 85 },
  { name: 'full', w: 1200, h: 1200, fit: 'inside' as const, q: 90 },
]

export async function uploadImages(req: Request, res: Response) {
  if (!r2Configured()) throw badRequest('El almacenamiento de imágenes (R2) no está configurado')
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw notFound('Producto no encontrado')

  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  if (files.length === 0) throw badRequest('No se recibió ninguna imagen')

  const agg = await prisma.productImage.aggregate({ where: { productId: id }, _max: { position: true } })
  let position = (agg._max.position ?? -1) + 1

  const created = []
  for (const file of files) {
    const base = `products/${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const urls: Record<string, string> = {}
    for (const s of SIZES) {
      const buf = await sharp(file.buffer).rotate().resize(s.w, s.h, { fit: s.fit }).webp({ quality: s.q }).toBuffer()
      urls[s.name] = await uploadObject(`${base}-${s.name}.webp`, buf, 'image/webp')
    }
    const img = await prisma.productImage.create({
      data: {
        productId: id,
        urlThumb: urls.thumb!,
        urlMedium: urls.medium!,
        urlFull: urls.full!,
        position: position++,
      },
    })
    created.push(img)
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
