import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { conflict, notFound } from '../lib/errors.js'

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

// Prisma returns Decimal for price; serialize to a plain number for JSON/clients.
function serialize<T extends { price?: unknown }>(p: T): T & { price: number | null } {
  return { ...p, price: p.price == null ? null : Number(p.price) }
}

const PRODUCT_INCLUDE = {
  images: { orderBy: { position: 'asc' as const }, take: 1 },
  brand: { select: { id: true, name: true } },
  partType: { select: { id: true, name: true } },
  compatibleModels: { include: { model: { select: { code: true, name: true } } } },
}

const listQuery = z.object({
  q: z.string().trim().optional(),
  categoryId: z.string().optional(),
  partTypeId: z.string().optional(),
  brandId: z.union([z.string(), z.array(z.string())]).optional(),
  modelId: z.union([z.string(), z.array(z.string())]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isNew: z.coerce.boolean().optional(),
  isCompleteUnit: z.enum(['true', 'false']).optional(),
  includeInactive: z.coerce.boolean().optional(),
  sort: z.enum(['relevance', 'price-asc', 'price-desc', 'newest', 'name']).default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
})

export async function list(req: Request, res: Response) {
  const p = listQuery.parse(req.query)
  const brandIds = toArray(p.brandId)
  const modelIds = toArray(p.modelId)
  const showAll = p.includeInactive === true && req.localUser?.role === 'ADMIN'

  // --- free-text search: model-code detection + brand-alias + name/code/desc per token (AND) ---
  const searchAnd: Prisma.ProductWhereInput[] = []
  if (p.q && p.q.length >= 2) {
    const tokens = p.q.split(/\s+/).filter(Boolean)
    const modelHits = await prisma.equipmentModel.findMany({
      where: { code: { in: tokens.map((t) => t.toUpperCase()) } },
      select: { id: true, code: true },
    })
    const hitCodes = new Set(modelHits.map((m) => m.code))
    if (modelHits.length) {
      searchAnd.push({ compatibleModels: { some: { modelId: { in: modelHits.map((m) => m.id) } } } })
    }
    const brands = await prisma.brand.findMany({ select: { id: true, name: true, aliases: true } })
    for (const t of tokens) {
      if (hitCodes.has(t.toUpperCase())) continue
      const tl = t.toLowerCase()
      const brandHit = brands.find(
        (b) => b.name.toLowerCase() === tl || b.aliases.some((a) => a.toLowerCase() === tl),
      )
      if (brandHit) {
        searchAnd.push({ brandId: brandHit.id })
        continue
      }
      searchAnd.push({
        OR: [
          { code: { contains: t, mode: 'insensitive' } },
          { name: { contains: t, mode: 'insensitive' } },
          { description: { contains: t, mode: 'insensitive' } },
        ],
      })
    }
  }

  const frag: Record<string, Prisma.ProductWhereInput | undefined> = {
    active: showAll ? undefined : { active: true },
    category: p.categoryId ? { categoryId: p.categoryId } : undefined,
    partType: p.partTypeId ? { partTypeId: p.partTypeId } : undefined,
    brand: brandIds.length ? { brandId: { in: brandIds } } : undefined,
    model: modelIds.length ? { compatibleModels: { some: { modelId: { in: modelIds } } } } : undefined,
    price:
      p.minPrice !== undefined || p.maxPrice !== undefined
        ? {
            price: {
              ...(p.minPrice !== undefined ? { gte: p.minPrice } : {}),
              ...(p.maxPrice !== undefined ? { lte: p.maxPrice } : {}),
            },
          }
        : undefined,
    isNew: p.isNew ? { isNew: true } : undefined,
    unit: p.isCompleteUnit ? { isCompleteUnit: p.isCompleteUnit === 'true' } : undefined,
    search: searchAnd.length ? { AND: searchAnd } : undefined,
  }
  // Compose where from all fragments; for facets, exclude that facet's own dimension
  // so the user can still see counts for other options in a multi-select.
  const compose = (except?: string): Prisma.ProductWhereInput => {
    const parts = Object.entries(frag)
      .filter(([k, v]) => v !== undefined && k !== except)
      .map(([, v]) => v as Prisma.ProductWhereInput)
    return parts.length ? { AND: parts } : {}
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    p.sort === 'price-asc'
      ? { price: 'asc' }
      : p.sort === 'price-desc'
        ? { price: 'desc' }
        : p.sort === 'newest'
          ? { createdAt: 'desc' }
          : { name: 'asc' }

  const whereAll = compose()
  const [rows, total, catGroups, brandGroups, partGroups, priceAgg, cats, brandList, partList] =
    await Promise.all([
      prisma.product.findMany({
        where: whereAll,
        orderBy,
        skip: (p.page - 1) * p.limit,
        take: p.limit,
        include: PRODUCT_INCLUDE,
      }),
      prisma.product.count({ where: whereAll }),
      prisma.product.groupBy({ by: ['categoryId'], where: compose('category'), _count: { _all: true } }),
      prisma.product.groupBy({ by: ['brandId'], where: compose('brand'), _count: { _all: true } }),
      prisma.product.groupBy({ by: ['partTypeId'], where: compose('partType'), _count: { _all: true } }),
      prisma.product.aggregate({ where: compose('price'), _min: { price: true }, _max: { price: true } }),
      prisma.category.findMany({ where: { active: true }, select: { id: true, name: true } }),
      prisma.brand.findMany({ where: { active: true }, select: { id: true, name: true } }),
      prisma.partType.findMany({ where: { active: true }, select: { id: true, name: true } }),
    ])

  const nameMap = (arr: { id: string; name: string }[]) => new Map(arr.map((x) => [x.id, x.name]))
  const catNames = nameMap(cats)
  const brandNames = nameMap(brandList)
  const partNames = nameMap(partList)

  type Group = { _count: { _all: number } } & Record<string, unknown>
  const facetFrom = (groups: Group[], idKey: string, names: Map<string, string>, nullLabel?: string) =>
    groups
      .map((g) => {
        const id = g[idKey] as string | null
        const name = id ? names.get(id) : nullLabel
        if (!name) return null
        return { id: id ?? null, name, count: g._count._all }
      })
      .filter((x): x is { id: string | null; name: string; count: number } => x !== null)
      .sort((a, b) => b.count - a.count)

  res.json({
    data: rows.map(serialize),
    total,
    page: p.page,
    limit: p.limit,
    facets: {
      categories: facetFrom(catGroups as Group[], 'categoryId', catNames),
      brands: facetFrom(brandGroups as Group[], 'brandId', brandNames, 'Genérico'),
      partTypes: facetFrom(partGroups as Group[], 'partTypeId', partNames),
      priceRange: {
        min: priceAgg._min.price == null ? 0 : Number(priceAgg._min.price),
        max: priceAgg._max.price == null ? 0 : Number(priceAgg._max.price),
      },
    },
  })
}

export async function getOne(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      ...PRODUCT_INCLUDE,
      images: { orderBy: { position: 'asc' } },
      category: { select: { id: true, name: true, slug: true } },
    },
  })
  if (!product) throw notFound('Producto no encontrado')
  res.json({ product: serialize(product) })
}

const relatedQuery = z.object({ limit: z.coerce.number().int().positive().max(12).default(4) })

export async function related(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const { limit } = relatedQuery.parse(req.query)
  const base = await prisma.product.findUnique({ where: { id }, include: { compatibleModels: true } })
  if (!base) throw notFound('Producto no encontrado')

  const modelIds = base.compatibleModels.map((m) => m.modelId)
  const or: Prisma.ProductWhereInput[] = []
  if (base.partTypeId) or.push({ partTypeId: base.partTypeId })
  if (modelIds.length) or.push({ compatibleModels: { some: { modelId: { in: modelIds } } } })
  if (or.length === 0) or.push({ categoryId: base.categoryId })

  const rows = await prisma.product.findMany({
    where: { active: true, id: { not: id }, OR: or },
    take: limit,
    include: PRODUCT_INCLUDE,
  })
  res.json({ data: rows.map(serialize) })
}

// --- Admin create / update ---
const createSchema = z.object({
  code: z.string().trim().min(1, 'El código es requerido'),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().default(0),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  partTypeId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  isCompleteUnit: z.boolean().optional(),
  isNew: z.boolean().optional(),
  active: z.boolean().optional(),
  modelIds: z.array(z.string()).optional(),
})

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body)
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
  if (!category) throw notFound('La categoría indicada no existe')
  const existing = await prisma.product.findUnique({ where: { code: input.code } })
  if (existing) throw conflict('Ya existe un producto con ese código')

  const product = await prisma.product.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      categoryId: input.categoryId,
      partTypeId: input.partTypeId ?? null,
      brandId: input.brandId ?? null,
      isCompleteUnit: input.isCompleteUnit ?? false,
      isNew: input.isNew ?? false,
      ...(input.modelIds?.length
        ? { compatibleModels: { create: input.modelIds.map((modelId) => ({ modelId })) } }
        : {}),
    },
    include: PRODUCT_INCLUDE,
  })
  res.status(201).json({ product: serialize(product) })
}

const updateSchema = createSchema.partial()

export async function update(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Producto no encontrado')
  const input = updateSchema.parse(req.body)

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw notFound('Producto no encontrado')
  if (input.categoryId) {
    const c = await prisma.category.findUnique({ where: { id: input.categoryId } })
    if (!c) throw notFound('La categoría indicada no existe')
  }
  if (input.code && input.code !== existing.code) {
    const clash = await prisma.product.findUnique({ where: { code: input.code } })
    if (clash) throw conflict('Ya existe un producto con ese código')
  }

  const { modelIds, ...scalars } = input
  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: scalars as Prisma.ProductUncheckedUpdateInput })
    if (modelIds) {
      await tx.productModel.deleteMany({ where: { productId: id } })
      if (modelIds.length) {
        await tx.productModel.createMany({ data: modelIds.map((modelId) => ({ productId: id, modelId })) })
      }
    }
  })
  const full = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE })
  res.json({ product: serialize(full!) })
}
