import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { api } from '../lib/api'
import type { Me } from '../types/auth'

/** The signed-in user's local account (approval status + role + profile). */
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

export interface ProfileInput {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  city?: string | null
  company?: string | null
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      const { data } = await api.patch<{ user: Me }>('/auth/me', input)
      return data.user
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await api.post<{ user: Me }>('/auth/me/photo', fd)
      return data.user
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
