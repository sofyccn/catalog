import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } })

export const authRouter = Router()

// Auth itself (login/signup/logout) is handled by Clerk on the frontend.
// This reports the local account state and lets the signed-in user manage their own profile.
authRouter.get('/me', asyncHandler(attachUser), authController.me)
authRouter.patch('/me', asyncHandler(attachUser), asyncHandler(authController.updateProfile))
authRouter.post('/me/photo', asyncHandler(attachUser), upload.single('photo'), asyncHandler(authController.uploadPhoto))
