import type { RequestStatus } from '../generated/prisma/client.js'
import { badRequest } from './errors.js'

/**
 * The only legal status moves. Enforced server-side so the API can never be
 * pushed into an invalid state, regardless of what a client sends.
 *
 *   DRAFT     → SENT, CANCELLED
 *   SENT      → IN_REVIEW, CANCELLED
 *   IN_REVIEW → REVIEWED
 *   REVIEWED  → APPROVED, REJECTED, CANCELLED
 *   APPROVED / REJECTED / CANCELLED → (terminal)
 */
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['REVIEWED'],
  REVIEWED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    throw badRequest(`Transición de estado inválida: ${from} → ${to}`)
  }
}
