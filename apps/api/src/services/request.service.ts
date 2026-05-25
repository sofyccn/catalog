import type { RequestStatus } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { assertTransition } from '../lib/requestStateMachine.js'
import { notFound } from '../lib/errors.js'

// Which timestamp column to stamp when entering a given status.
const TIMESTAMP_FIELD: Partial<Record<RequestStatus, 'sentAt' | 'reviewedAt' | 'decidedAt'>> = {
  SENT: 'sentAt',
  REVIEWED: 'reviewedAt',
  APPROVED: 'decidedAt',
  REJECTED: 'decidedAt',
  CANCELLED: 'decidedAt',
}

/**
 * Transition a request to a new status: validate the move, stamp the relevant
 * timestamp, and append a RequestStatusHistory row — all in one transaction.
 */
export async function changeStatus(
  requestId: string,
  to: RequestStatus,
  changedById: string,
  notes?: string,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.request.findUnique({ where: { id: requestId } })
    if (!current) throw notFound('Pedido no encontrado')

    assertTransition(current.status, to)

    const data: { status: RequestStatus; sentAt?: Date; reviewedAt?: Date; decidedAt?: Date } = {
      status: to,
    }
    const stamp = TIMESTAMP_FIELD[to]
    if (stamp && !current[stamp]) data[stamp] = new Date()

    const updated = await tx.request.update({ where: { id: requestId }, data })
    await tx.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: current.status,
        toStatus: to,
        changedById,
        notes: notes ?? null,
      },
    })
    return updated
  })
}
