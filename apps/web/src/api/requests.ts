import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export type RequestStatus =
  | 'DRAFT'
  | 'SENT'
  | 'IN_REVIEW'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface RequestItemDetail {
  id: string
  productId: string
  quantity: number
  available: boolean | null
  observations: string | null
  product: { id: string; code: string; name: string; description: string | null }
}
export interface RequestClient {
  id: string
  fullName: string
  email: string
}
export interface RequestHistory {
  id: string
  fromStatus: RequestStatus | null
  toStatus: RequestStatus
  notes: string | null
  changedAt: string
  changedBy: { fullName: string; role: string | null }
}
export interface OrderRequest {
  id: string
  status: RequestStatus
  notes: string | null
  createdAt: string
  sentAt: string | null
  reviewedAt: string | null
  decidedAt: string | null
  items: RequestItemDetail[]
  client?: RequestClient
  history?: RequestHistory[]
}
export interface RequestSummary {
  id: string
  status: RequestStatus
  notes: string | null
  createdAt: string
  client?: RequestClient
  _count: { items: number }
}

export function useRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: ['requests', { status: status ?? null }],
    queryFn: async () =>
      (await api.get<{ data: RequestSummary[] }>('/requests', { params: status ? { status } : {} }))
        .data.data,
  })
}

export function useRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['request', id],
    enabled: !!id,
    queryFn: async () => (await api.get<{ request: OrderRequest }>(`/requests/${id}`)).data.request,
  })
}

export interface SendOrderInput {
  items: { productId: string; quantity: number }[]
  notes?: string
}

/** Create a DRAFT request from the cart and immediately send it (DRAFT -> SENT). */
export function useSendOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SendOrderInput) => {
      const created = (await api.post<{ request: OrderRequest }>('/requests', input)).data.request
      const sent = (await api.post<{ request: OrderRequest }>(`/requests/${created.id}/send`)).data
        .request
      return sent
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })
}

/** Client decision on a REVIEWED order (or cancel from any non-terminal state). */
export function useClientDecision(action: 'approve' | 'reject' | 'cancel') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ request: OrderRequest }>(`/requests/${id}/${action}`)).data.request,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['request', id] })
    },
  })
}

/** Dispatcher actions: start review, set item availability, complete review. */
export function useStartReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ request: OrderRequest }>(`/requests/${id}/start-review`)).data.request,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['request', id] })
    },
  })
}

export function useReviewItem(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { itemId: string; available?: boolean; observations?: string }) => {
      const { itemId, ...body } = input
      return (await api.patch(`/requests/${requestId}/items/${itemId}`, body)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request', requestId] }),
  })
}

export function useCompleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ request: OrderRequest }>(`/requests/${id}/complete-review`)).data.request,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['request', id] })
    },
  })
}
