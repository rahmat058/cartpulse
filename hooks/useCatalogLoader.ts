'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/lib/store/hooks'
import {
  setCatalogFailed,
  setCatalogFromQuery,
  setCatalogLoading,
} from '@/lib/store/slices/cartSlice'
import { useProducts } from '@/hooks/use-products'
import { useCart } from '@/hooks/use-cart'
import type { CatalogQueryParams } from '@/types/cart'

export function useCatalogLoader(query: CatalogQueryParams = {}) {
  const dispatch = useAppDispatch()
  useCart()
  const { data, isLoading, isError, error, isFetching, refetch } = useProducts(query)

  useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(setCatalogLoading())
    }
  }, [isLoading, isFetching, dispatch])

  useEffect(() => {
    if (data) {
      dispatch(setCatalogFromQuery(data))
    }
  }, [data, dispatch])

  useEffect(() => {
    if (isError) {
      dispatch(
        setCatalogFailed(error instanceof Error ? error.message : 'Failed to load catalog'),
      )
    }
  }, [isError, error, dispatch])

  return { refetchCatalog: refetch }
}
