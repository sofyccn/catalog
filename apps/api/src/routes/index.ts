import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { usersRouter } from './users.routes.js'
import { categoriesRouter } from './categories.routes.js'
import { productsRouter } from './products.routes.js'
export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/categories', categoriesRouter)
apiRouter.use('/products', productsRouter)