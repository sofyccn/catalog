import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { usersRouter } from './users.routes.js'
import { categoriesRouter } from './categories.routes.js'
import { productsRouter } from './products.routes.js'
import { requestsRouter } from './requests.routes.js'
import { brandsRouter, partTypesRouter, equipmentModelsRouter } from './taxonomy.routes.js'
export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/categories', categoriesRouter)
apiRouter.use('/products', productsRouter)
apiRouter.use('/requests', requestsRouter)
apiRouter.use('/brands', brandsRouter)
apiRouter.use('/part-types', partTypesRouter)
apiRouter.use('/equipment-models', equipmentModelsRouter)