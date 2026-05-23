import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/env.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(compression())
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'))
  app.use(express.json())

  app.use('/api/v1', apiRouter)

  app.use(errorHandler)
  return app
}
