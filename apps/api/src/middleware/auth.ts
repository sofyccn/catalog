import type { RequestHandler } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import type { Role } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { forbidden, unauthorized } from '../lib/errors.js'

/**
 * Requires a valid Clerk session, then loads the matching local User row.
 * On first sight of a Clerk user we provision a local row:
 *   - the bootstrap-admin email → ACTIVE + ADMIN
 *   - everyone else → PENDING (awaiting admin approval)
 */
export const attachUser: RequestHandler = async (req, _res, next) => {
  const { userId } = getAuth(req)
  if (!userId) throw unauthorized('No autenticado')

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId)
    const email = (
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `clerk_${userId}@unknown.local`
    ).toLowerCase()
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email || 'Usuario'
    const isBootstrap =
      !!env.BOOTSTRAP_ADMIN_EMAIL && email === env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()

    // Upsert by email so a pre-existing row (e.g. legacy seed) gets linked instead of colliding.
    user = await prisma.user.upsert({
      where: { email },
      update: { clerkId: userId },
      create: {
        clerkId: userId,
        email,
        fullName,
        status: isBootstrap ? 'ACTIVE' : 'PENDING',
        role: isBootstrap ? 'ADMIN' : null,
      },
    })
  }

  req.localUser = user
  next()
}

/** Must be an approved, active account. Use after attachUser. */
export const requireActive: RequestHandler = (req, _res, next) => {
  const user = req.localUser
  if (!user) throw unauthorized()
  if (!user.active || user.status !== 'ACTIVE') {
    throw forbidden('Tu cuenta no está activa')
  }
  next()
}

/** Restricts to one of the given roles. Use after requireActive. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    const user = req.localUser
    if (!user || !user.role || !roles.includes(user.role)) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }
    next()
  }
