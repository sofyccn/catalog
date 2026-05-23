import axios from 'axios'
import { useAuthStore } from '../stores/auth'

/** Shared axios instance. Vite proxies /api to the backend in dev. */
export const api = axios.create({
  baseURL: '/api/v1',
})

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On an expired/invalid session, clear auth so the app bounces to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    if (status === 401 && !url.includes('/auth/login')) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

/** Pull a human-friendly Spanish message out of an API error. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? error.message ?? fallback
  }
  return fallback
}
