import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive, requireRole } from '../middleware/auth.js'
import * as usersController from '../controllers/users.controller.js'

export const usersRouter = Router()

// Admin-only: the access-request approval queue and user management.
usersRouter.use(asyncHandler(attachUser), requireActive, requireRole('ADMIN'))

usersRouter.get('/', asyncHandler(usersController.list))
usersRouter.get('/pending-count', asyncHandler(usersController.pendingCount))
usersRouter.post('/:id/approve', asyncHandler(usersController.approve))
usersRouter.post('/:id/reject', asyncHandler(usersController.reject))
