import type { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service.js'
import { unauthorized } from '../lib/errors.js'
import { signAccessToken, verifyRefreshToken } from '../lib/jwt.js'

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken es requerido'),
})

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body)
  const result = await authService.login(email, password)
  res.json(result)
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw unauthorized()
  const user = await authService.getUserById(req.user.sub)
  if (!user) throw unauthorized()
  res.json({ user })
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body)
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw unauthorized('Refresh token inválido o expirado')
  }
  const token = signAccessToken({ sub: payload.sub, email: payload.email, role: payload.role })
  res.json({ token })
}
