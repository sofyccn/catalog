import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Wraps a route handler (sync or async) so thrown errors and rejected promises
 * are forwarded to Express's error handler instead of crashing the process.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
