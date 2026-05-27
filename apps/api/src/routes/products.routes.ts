import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive, requireRole } from '../middleware/auth.js'
import * as productsController from '../controllers/products.controller.js'
import * as imagesController from '../controllers/images.controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

export const productsRouter = Router()

// All catalog reads require a signed-in, active user.
productsRouter.use(asyncHandler(attachUser), requireActive)

productsRouter.get('/', asyncHandler(productsController.list))
productsRouter.get('/:id/related', asyncHandler(productsController.related))
productsRouter.get('/:id', asyncHandler(productsController.getOne))

// Mutations are admin-only.
productsRouter.post('/', requireRole('ADMIN'), asyncHandler(productsController.create))
productsRouter.patch('/:id', requireRole('ADMIN'), asyncHandler(productsController.update))

// Images (admin): multipart upload (sharp -> R2) + delete.
productsRouter.post('/:id/images', requireRole('ADMIN'), upload.array('images', 5), asyncHandler(imagesController.uploadImages))
productsRouter.delete('/:id/images/:imageId', requireRole('ADMIN'), asyncHandler(imagesController.deleteImage))
