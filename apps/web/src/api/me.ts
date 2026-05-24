import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { api } from '../lib/api'
import type { Me } from '../types/auth'

/** The signed-in user's local account (approval status + role). */
export function useMe() {
  const { isLoaded, isSignedIn } = useAuth()
  return useQuery({
    queryKey: ['me'],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async () => {
      const { data } = await api.get<{ user: Me }>('/auth/me')
      return data.user
    },
  })
}
