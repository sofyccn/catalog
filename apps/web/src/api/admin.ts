import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Category, Product, ProductPage } from './catalog'

/** Admin product list — includes inactive products. The API uses `q` for
 *  full-text search across name / code / description; we pass it through
 *  from the admin search input. */
export function useAdminProducts(search?: string) {
  return useQuery({
    queryKey: ['admin-products', { q: search ?? '' }],
    queryFn: async () =>
      (
        await api.get<ProductPage>('/products', {
          params: { includeInactive: true, limit: 200, ...(search ? { q: search } : {}) },
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

export function useUploadImages(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData()
      files.forEach((f) => fd.append('images', f))
      return (await api.post(`/products/${productId}/images`, fd)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Ingest images the clipboard only exposed as remote URLs (Canva, Google Docs,
 * Word Online). The API downloads them server-side, which also avoids CORS.
 */
export function useUploadImagesFromUrls(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (urls: string[]) =>
      (await api.post(`/products/${productId}/images/from-url`, { urls })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteImage(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: string) => (await api.delete(`/products/${productId}/images/${imageId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
