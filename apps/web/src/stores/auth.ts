import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, User } from '../types/auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (data: LoginResponse) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'catalog-auth' },
  ),
)
