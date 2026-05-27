import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { attachUser, requireActive, requireRole } from '../middleware/auth.js'
import * as taxonomy from '../controllers/taxonomy.controller.js'

// Build a router: GET is open to any active user; create/update/deactivate are ADMIN-only.
function crudRouter(handlers: {
  list: RequestHandler
  create: RequestHandler
  update: RequestHandler
  deactivate: RequestHandler
}) {
  const r = Router()
  r.use(asyncHandler(attachUser), requireActive)
  r.get('/', asyncHandler(handlers.list))
  r.post('/', requireRole('ADMIN'), asyncHandler(handlers.create))
  r.patch('/:id', requireRole('ADMIN'), asyncHandler(handlers.update))
  r.delete('/:id', requireRole('ADMIN'), asyncHandler(handlers.deactivate))
  return r
}

export const brandsRouter = crudRouter({
  list: taxonomy.listBrands,
  create: taxonomy.createBrand,
  update: taxonomy.updateBrand,
  deactivate: taxonomy.deactivateBrand,
})

export const partTypesRouter = crudRouter({
  list: taxonomy.listPartTypes,
  create: taxonomy.createPartType,
  update: taxonomy.updatePartType,
  deactivate: taxonomy.deactivatePartType,
})

export const equipmentModelsRouter = crudRouter({
  list: taxonomy.listModels,
  create: taxonomy.createModel,
  update: taxonomy.updateModel,
  deactivate: taxonomy.deactivateModel,
})
