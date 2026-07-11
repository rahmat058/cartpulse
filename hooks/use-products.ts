'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '@/lib/services/products-client'
import { queryKeys } from '@/lib/query/keys'
import type { CatalogQueryParams } from '@/types/cart'

export function useProducts(query: CatalogQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: ({ signal }) => fetchProducts(query, signal),
  })
}
