import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive, requireRole } from '../middleware/auth.js'
import * as productsController from '../controllers/products.controller.js'

export const productsRouter = Router()

// All catalog reads require a signed-in, active user.
productsRouter.use(asyncHandler(attachUser), requireActive)

productsRouter.get('/', asyncHandler(productsController.list))
productsRouter.get('/:id/related', asyncHandler(productsController.related))
productsRouter.get('/:id', asyncHandler(productsController.getOne))

// Mutations are admin-only.
productsRouter.post('/', requireRole('ADMIN'), asyncHandler(productsController.create))
productsRouter.patch('/:id', requireRole('ADMIN'), asyncHandler(productsController.update))
