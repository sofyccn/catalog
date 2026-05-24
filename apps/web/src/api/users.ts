import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Me, Role } from '../types/auth'

export function usePendingUsers() {
  return useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Me[] }>('/users', { params: { status: 'PENDING' } })
      return data.data
    },
  })
}

export function useApproveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { data } = await api.post<{ user: Me }>(`/users/${id}/approve`, { role })
      return data.user
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useRejectUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ user: Me }>(`/users/${id}/reject`, {})
      return data.user
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
