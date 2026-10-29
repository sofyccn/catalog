import type { NextFunction, Request, Response } from 'express'

/** Fields only staff (admin / dispatcher) may see, wherever they appear in a response. */
const STAFF_ONLY_FIELDS = new Set(['warehouseLocation'])

function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) if (!STAFF_ONLY_FIELDS.has(k)) out[k] = strip(v)
    return out
  }
  return value
}

/**
 * Removes staff-only fields (the warehouse casillero) from every JSON response
 * sent to a CLIENT. Done once at the edge so no endpoint can leak it, including
 * products nested inside orders. The role is read at send time, after the
 * route's auth middleware has attached the user.
 */
export function hideStaffFields(req: Request, res: Response, next: NextFunction) {
  const json = res.json.bind(res)
  res.json = (body: unknown) => json(req.localUser?.role === 'CLIENT' ? strip(body) : body)
  next()
}
