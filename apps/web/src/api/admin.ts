import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Category, Product, ProductPage } from './catalog'

/** Admin product list — includes inactive products. */
export function useAdminProducts(search?: string) {
  return useQuery({
    queryKey: ['admin-products', { search: search ?? '' }],
    queryFn: async () =>
      (
        await api.get<ProductPage>('/products', {
          params: { includeInactive: true, limit: 200, ...(search ? { search } : {}) },
        })
      ).data,
  })
}

export interface ProductInput {
  code: string
  name: string
  description?: string
  price?: number
  categoryId: string
  partTypeId?: string | null
  brandId?: string | null
  isCompleteUnit?: boolean
  isNew?: boolean
  active?: boolean
  modelIds?: string[]
}

export function useSaveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ProductInput }) => {
      if (id) return (await api.patch<{ product: Product }>(`/products/${id}`, input)).data.product
      return (await api.post<{ product: Product }>('/products', input)).data.product
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useToggleProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      (await api.patch<{ product: Product }>(`/products/${id}`, { active })).data.product,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) =>
      (await api.post<{ category: Category }>('/categories', { name })).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeactivateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
