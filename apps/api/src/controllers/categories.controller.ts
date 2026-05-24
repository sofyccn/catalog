import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { slugify } from '../lib/slugify.js'
import { conflict, notFound } from '../lib/errors.js'

export async function list(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  res.json({ data: categories })
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
})

export async function create(req: Request, res: Response) {
  const { name } = createSchema.parse(req.body)
  const slug = slugify(name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) throw conflict('Ya existe una categoría con ese nombre')
  const category = await prisma.category.create({ data: { name, slug } })
  res.status(201).json({ category })
}

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
})

export async function update(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Categoría no encontrada')
  const data = updateSchema.parse(req.body)

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw notFound('Categoría no encontrada')

  const patch: { name?: string; slug?: string; active?: boolean } = {}
  if (data.name !== undefined) {
    patch.name = data.name
    patch.slug = slugify(data.name)
    const clash = await prisma.category.findFirst({ where: { slug: patch.slug, id: { not: id } } })
    if (clash) throw conflict('Ya existe una categoría con ese nombre')
  }
  if (data.active !== undefined) patch.active = data.active

  const category = await prisma.category.update({ where: { id }, data: patch })
  res.json({ category })
}

// Soft delete: keep the row (Products reference it), just mark it inactive.
export async function remove(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Categoría no encontrada')
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw notFound('Categoría no encontrada')
  const category = await prisma.category.update({ where: { id }, data: { active: false } })
  res.json({ category })
}
