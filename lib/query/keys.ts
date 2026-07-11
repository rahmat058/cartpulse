import type { CatalogQueryParams } from '@/types/cart'

export const queryKeys = {
  products: (query: CatalogQueryParams = {}) => ['products', query] as const,
  product: (slug: string) => ['product', slug] as const,
  categories: () => ['categories'] as const,
  stores: () => ['stores'] as const,
  orders: (scope: 'user' | 'admin' = 'user') => ['orders', scope] as const,
  order: (id: string) => ['order', id] as const,
  users: () => ['users'] as const,
  adminProducts: (storeId?: string) => ['admin', 'products', storeId ?? 'all'] as const,
  analytics: (range?: string) => ['analytics', range ?? '30d'] as const,
  reviews: () => ['reviews'] as const,
  library: () => ['library'] as const,
}
