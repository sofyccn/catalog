import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive } from '../middleware/auth.js'
import * as requests from '../controllers/requests.controller.js'

export const requestsRouter = Router()

// Any active user; per-action role/ownership checks live in the controllers.
requestsRouter.use(asyncHandler(attachUser), requireActive)

requestsRouter.get('/', asyncHandler(requests.list))
requestsRouter.post('/', asyncHandler(requests.create))
requestsRouter.get('/:id', asyncHandler(requests.getOne))

// Draft item editing (client)
requestsRouter.post('/:id/items', asyncHandler(requests.addItem))
requestsRouter.patch('/:id/items/:itemId', asyncHandler(requests.updateItem))
requestsRouter.delete('/:id/items/:itemId', asyncHandler(requests.removeItem))

// Lifecycle transitions
requestsRouter.post('/:id/send', asyncHandler(requests.send)) // client: DRAFT -> SENT
requestsRouter.post('/:id/start-review', asyncHandler(requests.startReview)) // worker: SENT -> IN_REVIEW
requestsRouter.post('/:id/complete-review', asyncHandler(requests.completeReview)) // worker: IN_REVIEW -> REVIEWED
requestsRouter.post('/:id/approve', asyncHandler(requests.approve)) // client: REVIEWED -> APPROVED
requestsRouter.post('/:id/reject', asyncHandler(requests.reject)) // client: REVIEWED -> REJECTED
requestsRouter.post('/:id/cancel', asyncHandler(requests.cancel)) // client: -> CANCELLED
