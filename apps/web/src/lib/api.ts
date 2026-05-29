import axios from 'axios'

// Clerk owns the session; ClerkTokenBridge registers a getter so every request
// carries a fresh Clerk token. Vite proxies /api to the backend in dev.
let tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: (() => Promise<string | null>) | null) {
  tokenGetter = fn
}

// `indexes: null` serializes arrays as ?brandId=a&brandId=b (no brackets), so
// Express 5's default 'simple' query parser sees the values as a real array.
// Without this, multi-select filters (brand/model) were silently dropped.
export const api = axios.create({ baseURL: '/api/v1', paramsSerializer: { indexes: null } })

api.interceptors.request.use(async (config) => {
  const token = tokenGetter ? await tokenGetter() : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Pull a human-friendly Spanish message out of an API error. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? error.message ?? fallback
  }
  return fallback
}
