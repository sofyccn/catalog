import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Category {
  id: string
  name: string
  slug: string
  active: boolean
}

export interface ProductImage {
  id: string
  urlThumb: string
  urlMedium: string
  urlFull: string
  position: number
}

export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  categoryId: string
  active: boolean
  images?: ProductImage[]
}

export interface ProductPage {
  data: Product[]
  total: number
  page: number
  limit: number
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  })
}

export interface ProductQuery {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
}

export function useProducts(params: ProductQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await api.get<ProductPage>('/products', { params })).data,
    placeholderData: keepPreviousData,
  })
}
