import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/login', asyncHandler(authController.login))
authRouter.post('/refresh', asyncHandler(authController.refresh))
authRouter.get('/me', requireAuth, asyncHandler(authController.me))
authRouter.post('/logout', (_req, res) => {
  // Stateless JWT: client discards tokens. Endpoint exists for symmetry and
  // a future refresh-token denylist.
  res.status(204).end()
})
