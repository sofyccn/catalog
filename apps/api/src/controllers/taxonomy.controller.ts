import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { conflict, notFound } from '../lib/errors.js'
import { slugify } from '../lib/slugify.js'

function pathId(req: Request): string {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('No encontrado')
  return id
}

// ---------------- Brands ----------------
export async function listBrands(_req: Request, res: Response) {
  const data = await prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
  res.json({ data })
}

const brandSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  aliases: z.array(z.string().trim()).optional(),
})

export async function createBrand(req: Request, res: Response) {
  const { name, aliases } = brandSchema.parse(req.body)
  if (await prisma.brand.findUnique({ where: { name } })) throw conflict('Ya existe una marca con ese nombre')
  const brand = await prisma.brand.create({ data: { name, aliases: aliases ?? [] } })
  res.status(201).json({ brand })
}

export async function updateBrand(req: Request, res: Response) {
  const id = pathId(req)
  const data = brandSchema.partial().parse(req.body)
  if (!(await prisma.brand.findUnique({ where: { id } }))) throw notFound('Marca no encontrada')
  const brand = await prisma.brand.update({ where: { id }, data })
  res.json({ brand })
}

export async function deactivateBrand(req: Request, res: Response) {
  const id = pathId(req)
  if (!(await prisma.brand.findUnique({ where: { id } }))) throw notFound('Marca no encontrada')
  const brand = await prisma.brand.update({ where: { id }, data: { active: false } })
  res.json({ brand })
}

// ---------------- Part types ----------------
export async function listPartTypes(_req: Request, res: Response) {
  const data = await prisma.partType.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } })
  res.json({ data })
}

const partTypeSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  displayOrder: z.number().int().optional(),
})

export async function createPartType(req: Request, res: Response) {
  const { name, displayOrder } = partTypeSchema.parse(req.body)
  const slug = slugify(name)
  if (await prisma.partType.findUnique({ where: { slug } })) throw conflict('Ya existe un tipo de parte con ese nombre')
  const partType = await prisma.partType.create({ data: { name, slug, displayOrder: displayOrder ?? 0 } })
  res.status(201).json({ partType })
}

export async function updatePartType(req: Request, res: Response) {
  const id = pathId(req)
  const data = partTypeSchema.partial().parse(req.body)
  if (!(await prisma.partType.findUnique({ where: { id } }))) throw notFound('Tipo de parte no encontrado')
  const partType = await prisma.partType.update({ where: { id }, data })
  res.json({ partType })
}

export async function deactivatePartType(req: Request, res: Response) {
  const id = pathId(req)
  if (!(await prisma.partType.findUnique({ where: { id } }))) throw notFound('Tipo de parte no encontrado')
  const partType = await prisma.partType.update({ where: { id }, data: { active: false } })
  res.json({ partType })
}

// ---------------- Equipment models ----------------
const modelsQuery = z.object({ categoryId: z.string().optional() })

export async function listModels(req: Request, res: Response) {
  const { categoryId } = modelsQuery.parse(req.query)
  const data = await prisma.equipmentModel.findMany({
    where: { active: true, ...(categoryId ? { categoryId } : {}) },
    orderBy: { code: 'asc' },
    include: { brand: { select: { id: true, name: true } } },
  })
  res.json({ data })
}

const modelSchema = z.object({
  code: z.string().trim().min(1, 'El código es requerido'),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  brandId: z.string().nullable().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
})

export async function createModel(req: Request, res: Response) {
  const input = modelSchema.parse(req.body)
  if (await prisma.equipmentModel.findUnique({ where: { code: input.code } })) {
    throw conflict('Ya existe un modelo con ese código')
  }
  if (!(await prisma.category.findUnique({ where: { id: input.categoryId } }))) {
    throw notFound('La categoría indicada no existe')
  }
  const model = await prisma.equipmentModel.create({
    data: { code: input.code, name: input.name, brandId: input.brandId ?? null, categoryId: input.categoryId },
  })
  res.status(201).json({ model })
}

export async function updateModel(req: Request, res: Response) {
  const id = pathId(req)
  const data = modelSchema.partial().parse(req.body)
  if (!(await prisma.equipmentModel.findUnique({ where: { id } }))) throw notFound('Modelo no encontrado')
  const model = await prisma.equipmentModel.update({ where: { id }, data })
  res.json({ model })
}

export async function deactivateModel(req: Request, res: Response) {
  const id = pathId(req)
  if (!(await prisma.equipmentModel.findUnique({ where: { id } }))) throw notFound('Modelo no encontrado')
  const model = await prisma.equipmentModel.update({ where: { id }, data: { active: false } })
  res.json({ model })
}
