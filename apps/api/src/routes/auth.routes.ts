import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

export const authRouter = Router()

// Auth itself (login/signup/logout) is handled by Clerk on the frontend.
// This just reports the local account state for the signed-in Clerk user.
authRouter.get('/me', asyncHandler(attachUser), authController.me)
