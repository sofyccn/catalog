import type { Request, Response } from 'express'
import { z } from 'zod'
import type { User } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'
import { changeStatus } from '../services/request.service.js'

// --- helpers -------------------------------------------------------------

function actor(req: Request): User {
  if (!req.localUser) throw forbidden()
  return req.localUser
}
function isWorker(u: User): boolean {
  return u.role === 'DISPATCHER' || u.role === 'ADMIN'
}
function pathId(req: Request, msg = 'No encontrado'): string {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound(msg)
  return id
}

const REQUEST_INCLUDE = {
  items: { include: { product: true } },
  client: { select: { id: true, fullName: true, email: true } },
  history: {
    include: { changedBy: { select: { fullName: true, role: true } } },
    orderBy: { changedAt: 'asc' as const },
  },
}

// --- create / read -------------------------------------------------------

const itemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
})
const createSchema = z.object({
  items: z.array(itemInput).min(1, 'El pedido necesita al menos un producto'),
  notes: z.string().trim().optional(),
})

export async function create(req: Request, res: Response) {
  const u = actor(req)
  if (u.role !== 'CLIENT') throw forbidden('Solo los clientes pueden crear pedidos')
  const { items, notes } = createSchema.parse(req.body)

  // Validate all products exist & collapse duplicates (sum quantities).
  const byProduct = new Map<string, number>()
  for (const it of items) byProduct.set(it.productId, (byProduct.get(it.productId) ?? 0) + it.quantity)
  const ids = [...byProduct.keys()]
  const found = await prisma.product.count({ where: { id: { in: ids }, active: true } })
  if (found !== ids.length) throw badRequest('Uno o más productos no existen o están inactivos')

  const created = await prisma.request.create({
    data: {
      clientId: u.id,
      notes: notes ?? null,
      items: { create: [...byProduct].map(([productId, quantity]) => ({ productId, quantity })) },
      history: { create: { toStatus: 'DRAFT', changedById: u.id } },
    },
    include: REQUEST_INCLUDE,
  })
  res.status(201).json({ request: created })
}

const listQuery = z.object({
  status: z.enum(['DRAFT', 'SENT', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
})

export async function list(req: Request, res: Response) {
  const u = actor(req)
  const { status } = listQuery.parse(req.query)
  const requests = await prisma.request.findMany({
    where: {
      ...(u.role === 'CLIENT' ? { clientId: u.id } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, fullName: true, email: true } },
      _count: { select: { items: true } },
    },
  })
  res.json({ data: requests })
}

export async function getOne(req: Request, res: Response) {
  const u = actor(req)
  const id = pathId(req, 'Pedido no encontrado')
  const request = await prisma.request.findUnique({ where: { id }, include: REQUEST_INCLUDE })
  if (!request) throw notFound('Pedido no encontrado')
  if (u.role === 'CLIENT' && request.clientId !== u.id) throw forbidden('No es tu pedido')
  res.json({ request })
}

// --- draft item editing (client, DRAFT only) ----------------------------

async function loadOwnedDraft(req: Request, u: User) {
  const id = pathId(req, 'Pedido no encontrado')
  const request = await prisma.request.findUnique({ where: { id } })
  if (!request) throw notFound('Pedido no encontrado')
  if (u.role !== 'CLIENT' || request.clientId !== u.id) throw forbidden('No es tu pedido')
  if (request.status !== 'DRAFT') throw badRequest('Solo puedes editar un pedido en borrador')
  return request
}

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
})

export async function addItem(req: Request, res: Response) {
  const u = actor(req)
  const request = await loadOwnedDraft(req, u)
  const { productId, quantity } = addItemSchema.parse(req.body)
  const product = await prisma.product.findFirst({ where: { id: productId, active: true } })
  if (!product) throw badRequest('Producto no encontrado o inactivo')
  // Upsert the line (unique on requestId+productId): add to existing quantity.
  const item = await prisma.requestItem.upsert({
    where: { requestId_productId: { requestId: request.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { requestId: request.id, productId, quantity },
  })
  res.status(201).json({ item })
}

const updateItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  available: z.boolean().optional(),
  observations: z.string().trim().optional(),
})

export async function updateItem(req: Request, res: Response) {
  const u = actor(req)
  const requestId = pathId(req, 'Pedido no encontrado')
  const itemId = req.params.itemId
  if (typeof itemId !== 'string') throw notFound('Ítem no encontrado')
  const body = updateItemSchema.parse(req.body)

  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) throw notFound('Pedido no encontrado')
  const item = await prisma.requestItem.findFirst({ where: { id: itemId, requestId } })
  if (!item) throw notFound('Ítem no encontrado')

  // Client edits quantity while DRAFT; worker sets availability while IN_REVIEW.
  if (request.status === 'DRAFT') {
    if (u.role !== 'CLIENT' || request.clientId !== u.id) throw forbidden('No es tu pedido')
    if (body.quantity === undefined) throw badRequest('Indica la nueva cantidad')
    const updated = await prisma.requestItem.update({ where: { id: itemId }, data: { quantity: body.quantity } })
    return res.json({ item: updated })
  }
  if (request.status === 'IN_REVIEW') {
    if (!isWorker(u)) throw forbidden('Solo el despachador puede revisar')
    const updated = await prisma.requestItem.update({
      where: { id: itemId },
      data: {
        ...(body.available !== undefined ? { available: body.available } : {}),
        ...(body.observations !== undefined ? { observations: body.observations } : {}),
      },
    })
    return res.json({ item: updated })
  }
  throw badRequest('El pedido no admite cambios en este estado')
}

export async function removeItem(req: Request, res: Response) {
  const u = actor(req)
  const request = await loadOwnedDraft(req, u)
  const itemId = req.params.itemId
  if (typeof itemId !== 'string') throw notFound('Ítem no encontrado')
  await prisma.requestItem.deleteMany({ where: { id: itemId, requestId: request.id } })
  res.status(204).end()
}

// --- transitions ---------------------------------------------------------

const notesSchema = z.object({ notes: z.string().trim().optional() })

async function loadRequestFor(req: Request) {
  const id = pathId(req, 'Pedido no encontrado')
  const request = await prisma.request.findUnique({ where: { id } })
  if (!request) throw notFound('Pedido no encontrado')
  return request
}

// client: DRAFT -> SENT
export async function send(req: Request, res: Response) {
  const u = actor(req)
  const request = await loadRequestFor(req)
  if (u.role !== 'CLIENT' || request.clientId !== u.id) throw forbidden('No es tu pedido')
  const count = await prisma.requestItem.count({ where: { requestId: request.id } })
  if (count === 0) throw badRequest('El pedido está vacío')
  const updated = await changeStatus(request.id, 'SENT', u.id)
  res.json({ request: updated })
}

// worker: SENT -> IN_REVIEW
export async function startReview(req: Request, res: Response) {
  const u = actor(req)
  if (!isWorker(u)) throw forbidden('Solo el despachador puede revisar')
  const request = await loadRequestFor(req)
  const updated = await changeStatus(request.id, 'IN_REVIEW', u.id)
  res.json({ request: updated })
}

// worker: IN_REVIEW -> REVIEWED
export async function completeReview(req: Request, res: Response) {
  const u = actor(req)
  if (!isWorker(u)) throw forbidden('Solo el despachador puede revisar')
  const { notes } = notesSchema.parse(req.body)
  const request = await loadRequestFor(req)
  const updated = await changeStatus(request.id, 'REVIEWED', u.id, notes)
  res.json({ request: updated })
}

// client decisions on a REVIEWED request, and cancel from any non-terminal state.
function clientDecision(to: 'APPROVED' | 'REJECTED' | 'CANCELLED') {
  return async (req: Request, res: Response) => {
    const u = actor(req)
    const { notes } = notesSchema.parse(req.body)
    const request = await loadRequestFor(req)
    if (u.role !== 'CLIENT' || request.clientId !== u.id) throw forbidden('No es tu pedido')
    const updated = await changeStatus(request.id, to, u.id, notes)
    res.json({ request: updated })
  }
}

export const approve = clientDecision('APPROVED')
export const reject = clientDecision('REJECTED')
export const cancel = clientDecision('CANCELLED')
