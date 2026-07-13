import type { CatalogQueryParams, ProductsResponse } from '@/types/cart'
import { CATALOG_DEFAULT_PAGE_SIZE } from '@/types/cart'

function buildQueryString(query: CatalogQueryParams = {}): string {
  const params = new URLSearchParams()

  if (query.category && query.category !== 'all') params.set('category', query.category)
  if (query.priceMin !== undefined) params.set('priceMin', String(query.priceMin))
  if (query.priceMax !== undefined) params.set('priceMax', String(query.priceMax))
  if (query.minRating !== undefined) params.set('minRating', String(query.minRating))
  if (query.inStockOnly) params.set('inStock', 'true')
  if (query.freeDeliveryOnly) params.set('freeDelivery', 'true')
  if (query.sortBy) params.set('sort', query.sortBy)
  if (query.search) params.set('search', query.search)
  if (query.storeSlug) params.set('store', query.storeSlug)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize))

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function fetchProducts(
  query: CatalogQueryParams = {},
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const withDefaults: CatalogQueryParams = {
    pageSize: CATALOG_DEFAULT_PAGE_SIZE,
    ...query,
  }
  const response = await fetch(`/api/products${buildQueryString(withDefaults)}`, { signal })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Failed to load products (${response.status})`)
  }

  return response.json() as Promise<ProductsResponse>
}

export async function fetchProductBySlug(slug: string, signal?: AbortSignal): Promise<ProductsResponse> {
  const response = await fetch(`/api/products/${slug}`, { signal })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Failed to load product (${response.status})`)
  }

  return response.json() as Promise<ProductsResponse>
}
