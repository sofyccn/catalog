import type { RequestHandler } from 'express'
import type { Role } from '../generated/prisma/client.js'
import { verifyAccessToken } from '../lib/jwt.js'
import { forbidden, unauthorized } from '../lib/errors.js'

/** Verifies the Bearer access token and attaches the payload to req.user. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Falta el token de autenticación')
  }
  const token = header.slice('Bearer '.length)
  try {
    req.user = verifyAccessToken(token)
  } catch {
    throw unauthorized('Token inválido o expirado')
  }
  next()
}

/** Restricts a route to one of the given roles. Use after requireAuth. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }
    next()
  }
