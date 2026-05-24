import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { notFound } from '../lib/errors.js'
import { publicUser } from '../lib/publicUser.js'

const listQuery = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
})

export async function list(req: Request, res: Response) {
  const { status } = listQuery.parse(req.query)
  const users = await prisma.user.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: users.map(publicUser) })
}

export async function pendingCount(_req: Request, res: Response) {
  const count = await prisma.user.count({ where: { status: 'PENDING' } })
  res.json({ count })
}

const approveSchema = z.object({
  role: z.enum(['CLIENT', 'DISPATCHER', 'ADMIN']),
})

export async function approve(req: Request, res: Response) {
  const { role } = approveSchema.parse(req.body)
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Usuario no encontrado')
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw notFound('Usuario no encontrado')
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { status: 'ACTIVE', role, active: true },
  })
  res.json({ user: publicUser(updated) })
}

export async function reject(req: Request, res: Response) {
  const id = req.params.id
  if (typeof id !== 'string') throw notFound('Usuario no encontrado')
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw notFound('Usuario no encontrado')
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { status: 'REJECTED' },
  })
  res.json({ user: publicUser(updated) })
}
