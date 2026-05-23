import jwt from 'jsonwebtoken'
import type { Role } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: Role
}

const ACCESS_TTL = '15m'
const REFRESH_TTL = '7d'

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL })
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL })
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload
}
