/**
 * Application error carrying an HTTP status and a stable machine-readable code.
 * The error handler serializes these as { error: { code, message, details? } }.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details)
export const unauthorized = (message = 'No autorizado') =>
  new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'Acceso denegado') =>
  new AppError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Recurso no encontrado') =>
  new AppError(404, 'NOT_FOUND', message)
export const conflict = (message: string, details?: unknown) =>
  new AppError(409, 'CONFLICT', message, details)
