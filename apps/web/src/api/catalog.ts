import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Category {
  id: string
  name: string
  slug: string
  displayOrder: number
  active: boolean
}
export interface PartType {
  id: string
  name: string
  slug: string
  displayOrder: number
  active: boolean
}
export interface Brand {
  id: string
  name: string
  aliases?: string[]
  active: boolean
}
export interface EquipmentModel {
  id: string
  code: string
  name: string
  brand?: { id: string; name: string } | null
  categoryId: string
  active: boolean
}
export interface ProductImage {
  id: string
  urlThumb: string
  urlMedium: string
  urlFull: string
  position: number
}
export interface CompatibleModel {
  model: { code: string; name: string }
}
export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  price: number | null
  categoryId: string
  active: boolean
  isNew: boolean
  isCompleteUnit: boolean
  brand?: { id: string; name: string } | null
  partType?: { id: string; name: string } | null
  images?: ProductImage[]
  compatibleModels?: CompatibleModel[]
}
export interface Facet {
  id: string | null
  name: string
  count: number
}
export interface ProductPage {
  data: Product[]
  total: number
  page: number
  limit: number
  facets: {
    categories: Facet[]
    brands: Facet[]
    partTypes: Facet[]
    priceRange: { min: number; max: number }
  }
}
export interface ProductDetail extends Product {
  category?: { id: string; name: string; slug: string }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  })
}
export function usePartTypes() {
  return useQuery({
    queryKey: ['part-types'],
    queryFn: async () => (await api.get<{ data: PartType[] }>('/part-types')).data.data,
  })
}
export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get<{ data: Brand[] }>('/brands')).data.data,
  })
}
export function useEquipmentModels(categoryId?: string) {
  return useQuery({
    queryKey: ['equipment-models', categoryId ?? null],
    queryFn: async () =>
      (await api.get<{ data: EquipmentModel[] }>('/equipment-models', { params: categoryId ? { categoryId } : {} }))
        .data.data,
  })
}

export interface ProductQuery {
  q?: string
  categoryId?: string
  partTypeId?: string
  brandId?: string[]
  modelId?: string[]
  minPrice?: number
  maxPrice?: number
  isNew?: boolean
  isCompleteUnit?: 'true' | 'false'
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'name'
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

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => (await api.get<{ product: ProductDetail }>(`/products/${id}`)).data.product,
  })
}

export function useRelatedProducts(id: string | undefined) {
  return useQuery({
    queryKey: ['product-related', id],
    enabled: !!id,
    queryFn: async () => (await api.get<{ data: Product[] }>(`/products/${id}/related`)).data.data,
  })
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return `$${price.toFixed(2)}`
}
