import bcrypt from 'bcrypt'
import type { Role } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { unauthorized } from '../lib/errors.js'
import { signAccessToken, signRefreshToken, type AuthTokenPayload } from '../lib/jwt.js'

export interface PublicUser {
  id: string
  email: string
  fullName: string
  role: Role
  active: boolean
}

interface UserRecord extends PublicUser {
  passwordHash: string
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    active: user.active,
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) throw unauthorized('Credenciales inválidas')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw unauthorized('Credenciales inválidas')

  const payload: AuthTokenPayload = { sub: user.id, email: user.email, role: user.role }
  return {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: toPublicUser(user),
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? toPublicUser(user) : null
}
