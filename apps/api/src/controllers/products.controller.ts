import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { conflict, notFound } from '../lib/errors.js'

const listQuery = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().optional(),
  includeInactive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
})

export async function list(req: Request, res: Response) {
  const { search, categoryId, includeInactive, page, limit } = listQuery.parse(req.query)
  // Only admins may see inactive products (catalog management); everyone else sees active only.
  const showAll = includeInactive === true && req.localUser?.role === 'ADMIN'

  const where = {
    ...(showAll ? {} : { active: true }),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    }),
    prisma.product.count({ where }),
  ])

  res.json({ data, total, page, limit })
}

export async function getOne(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: 'asc' } }, category: true },
  })
  if (!product) throw notFound('Producto no encontrado')
  res.json({ product })
}

const createSchema = z.object({
  code: z.string().trim().min(1, 'El código es requerido'),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: z.string().trim().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
})

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body)

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
  if (!category) throw notFound('La categoría indicada no existe')

  const existing = await prisma.product.findUnique({ where: { code: input.code } })
  if (existing) throw conflict('Ya existe un producto con ese código')

  const product = await prisma.product.create({ data: input })
  res.status(201).json({ product })
}

const updateSchema = z.object({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  categoryId: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

export async function update(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const data = updateSchema.parse(req.body)

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw notFound('Producto no encontrado')

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) throw notFound('La categoría indicada no existe')
  }
  if (data.code && data.code !== existing.code) {
    const clash = await prisma.product.findUnique({ where: { code: data.code } })
    if (clash) throw conflict('Ya existe un producto con ese código')
  }

  const product = await prisma.product.update({ where: { id }, data })
  res.json({ product })
}
