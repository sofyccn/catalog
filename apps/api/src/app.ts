import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { clerkMiddleware } from '@clerk/express'
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
  // Body-less POSTs (e.g. /complete-review, /approve) leave req.body undefined;
  // default it to {} so handlers that validate an optional body don't 400.
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {}
    next()
  })

  // Parses the Clerk session from the request; getAuth(req) reads it downstream.
  app.use(clerkMiddleware())

  app.use('/api/v1', apiRouter)

  app.use(errorHandler)
  return app
}
