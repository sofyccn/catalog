import type { Request, Response } from 'express'
import { unauthorized } from '../lib/errors.js'
import { publicUser } from '../lib/publicUser.js'

/**
 * Returns the caller's local account, including approval `status` and `role`.
 * The frontend uses this to decide: PENDING → waiting screen, ACTIVE → app.
 */
export function me(req: Request, res: Response) {
  if (!req.localUser) throw unauthorized()
  res.json({ user: publicUser(req.localUser) })
}
