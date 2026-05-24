import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive, requireRole } from '../middleware/auth.js'
import * as categoriesController from '../controllers/categories.controller.js'

export const categoriesRouter = Router()

// All category reads require a signed-in, active user.
categoriesRouter.use(asyncHandler(attachUser), requireActive)

categoriesRouter.get('/', asyncHandler(categoriesController.list))
categoriesRouter.post('/', requireRole('ADMIN'), asyncHandler(categoriesController.create))
categoriesRouter.patch('/:id', requireRole('ADMIN'), asyncHandler(categoriesController.update))
categoriesRouter.delete('/:id', requireRole('ADMIN'), asyncHandler(categoriesController.remove))
