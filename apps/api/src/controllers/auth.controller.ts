import type { Request, Response } from 'express'
import { z } from 'zod'
import sharp from 'sharp'
import { prisma } from '../lib/prisma.js'
import { badRequest, unauthorized } from '../lib/errors.js'
import { publicUser } from '../lib/publicUser.js'
import { deleteObject, keyFromUrl, r2Configured, uploadObject } from '../lib/r2.js'

/**
 * Returns the caller's local account, including approval `status` and `role`.
 * The frontend uses this to decide: PENDING → waiting screen, ACTIVE → app.
 */
export function me(req: Request, res: Response) {
  if (!req.localUser) throw unauthorized()
  res.json({ user: publicUser(req.localUser) })
}

const profileSchema = z.object({
  firstName: z.string().trim().max(80).nullable().optional(),
  lastName: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  company: z.string().trim().max(120).nullable().optional(),
})

/** User updates their own profile. Available even while PENDING.
 *  When firstName/lastName change, fullName is recomputed so older UIs that
 *  still read fullName see the new value. */
export async function updateProfile(req: Request, res: Response) {
  if (!req.localUser) throw unauthorized()
  const data = profileSchema.parse(req.body)

  const nameChanged = data.firstName !== undefined || data.lastName !== undefined
  const nextFirst = data.firstName !== undefined ? data.firstName : req.localUser.firstName
  const nextLast = data.lastName !== undefined ? data.lastName : req.localUser.lastName
  const derivedFullName =
    [nextFirst, nextLast].filter(Boolean).join(' ').trim() ||
    req.localUser.email.split('@')[0] ||
    'Usuario'

  const updated = await prisma.user.update({
    where: { id: req.localUser.id },
    data: { ...data, ...(nameChanged ? { fullName: derivedFullName } : {}) },
  })
  res.json({ user: publicUser(updated) })
}

/** Profile photo upload: sharp -> 400x400 webp -> R2. Replaces any previous photo. */
export async function uploadPhoto(req: Request, res: Response) {
  if (!req.localUser) throw unauthorized()
  if (!r2Configured()) throw badRequest('El almacenamiento de imágenes no está configurado')
  const file = req.file as Express.Multer.File | undefined
  if (!file) throw badRequest('No se recibió ninguna foto')

  const buffer = await sharp(file.buffer).rotate().resize(400, 400, { fit: 'cover' }).webp({ quality: 85 }).toBuffer()
  const key = `users/${req.localUser.id}/photo-${Date.now()}.webp`
  const url = await uploadObject(key, buffer, 'image/webp')

  // Best-effort: remove previous photo from R2.
  if (req.localUser.photoUrl) {
    const oldKey = keyFromUrl(req.localUser.photoUrl)
    if (oldKey) await deleteObject(oldKey).catch(() => {})
  }

  const updated = await prisma.user.update({ where: { id: req.localUser.id }, data: { photoUrl: url } })
  res.json({ user: publicUser(updated) })
}
