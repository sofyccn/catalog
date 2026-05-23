import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import type { LoginResponse, User } from '../types/auth'

export interface Credentials {
  email: string
  password: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials)
      return data
    },
    onSuccess: (data) => setAuth(data),
  })
}

/** Fetch the current user (used to validate a persisted token on app load). */
export function useMe(enabled: boolean) {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['me'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
      return data.user
    },
  })
}
