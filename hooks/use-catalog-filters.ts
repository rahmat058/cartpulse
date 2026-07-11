'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
  resetAdvancedFilters,
  setCategoryFilter,
  setCatalogViewMode,
  setFreeDeliveryOnly,
  setInStockOnly,
  setMinRating,
  setPriceRange,
  setSortBy,
} from '@/lib/store/slices/cartSlice'
import {
  selectAdvancedFilters,
  selectCatalogPriceBounds,
  selectCategoryFilter,
} from '@/lib/store/selectors/cartSelectors'
import type { CatalogQueryParams, CatalogSortBy, CatalogViewMode, ProductCategory } from '@/types/cart'

function parseOptionalNumber(value: string | null): number | undefined {
  if (value == null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseNumber(value: string | null, fallback: number): number {
  return parseOptionalNumber(value) ?? fallback
}

export function useCatalogFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const dispatch = useAppDispatch()
  const categoryFilter = useAppSelector(selectCategoryFilter)
  const advancedFilters = useAppSelector(selectAdvancedFilters)
  const catalogBounds = useAppSelector(selectCatalogPriceBounds)

  // URL-only query — never bind fetch params to Redux price bounds (infinite loop).
  const query = useMemo<CatalogQueryParams>(() => {
    const params = new URLSearchParams(searchKey)
    const category = (params.get('category') as ProductCategory | null) ?? 'all'
    const minRating = parseOptionalNumber(params.get('minRating'))

    return {
      category: category === 'all' ? undefined : category,
      priceMin: parseOptionalNumber(params.get('priceMin')),
      priceMax: parseOptionalNumber(params.get('priceMax')),
      minRating: minRating && minRating > 0 ? minRating : undefined,
      inStockOnly: params.get('inStock') === 'true' || undefined,
      freeDeliveryOnly: params.get('freeDelivery') === 'true' || undefined,
      sortBy: (params.get('sort') as CatalogSortBy | null) ?? 'name-asc',
      search: params.get('search') ?? undefined,
      storeSlug: params.get('store') ?? undefined,
    }
  }, [searchKey])

  useEffect(() => {
    const params = new URLSearchParams(searchKey)
    const category = (params.get('category') as ProductCategory | null) ?? 'all'
    const priceMin = parseOptionalNumber(params.get('priceMin')) ?? catalogBounds.min
    const priceMax = parseOptionalNumber(params.get('priceMax')) ?? catalogBounds.max

    dispatch(setCategoryFilter(category))
    dispatch(setPriceRange({ min: priceMin, max: priceMax }))
    dispatch(setMinRating(parseNumber(params.get('minRating'), 0)))
    dispatch(setInStockOnly(params.get('inStock') === 'true'))
    dispatch(setFreeDeliveryOnly(params.get('freeDelivery') === 'true'))
    dispatch(setSortBy((params.get('sort') as CatalogSortBy | null) ?? 'name-asc'))
    dispatch(setCatalogViewMode((params.get('view') as CatalogViewMode | null) ?? 'grid'))
  }, [catalogBounds.max, catalogBounds.min, dispatch, searchKey])

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchKey)

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchKey],
  )

  const setCategory = useCallback(
    (category: ProductCategory) => {
      updateSearchParams({ category: category === 'all' ? null : category })
    },
    [updateSearchParams],
  )

  const setSort = useCallback(
    (sortBy: CatalogSortBy) => {
      updateSearchParams({ sort: sortBy === 'name-asc' ? null : sortBy })
    },
    [updateSearchParams],
  )

  const setViewMode = useCallback(
    (viewMode: CatalogViewMode) => {
      updateSearchParams({ view: viewMode === 'grid' ? null : viewMode })
    },
    [updateSearchParams],
  )

  const setMinRatingFilter = useCallback(
    (minRating: number) => {
      updateSearchParams({ minRating: minRating > 0 ? String(minRating) : null })
    },
    [updateSearchParams],
  )

  const setInStockFilter = useCallback(
    (inStockOnly: boolean) => {
      updateSearchParams({ inStock: inStockOnly ? 'true' : null })
    },
    [updateSearchParams],
  )

  const setFreeDeliveryFilter = useCallback(
    (freeDeliveryOnly: boolean) => {
      updateSearchParams({ freeDelivery: freeDeliveryOnly ? 'true' : null })
    },
    [updateSearchParams],
  )

  const setPriceRangeFilter = useCallback(
    (min: number, max: number) => {
      const atFullRange = min <= catalogBounds.min && max >= catalogBounds.max
      updateSearchParams({
        priceMin: atFullRange ? null : String(min),
        priceMax: atFullRange ? null : String(max),
      })
      dispatch(setPriceRange({ min, max }))
    },
    [catalogBounds.max, catalogBounds.min, dispatch, updateSearchParams],
  )

  const setSearch = useCallback(
    (search?: string) => {
      updateSearchParams({ search: search ?? null })
    },
    [updateSearchParams],
  )

  const clearAllFilters = useCallback(() => {
    dispatch(resetAdvancedFilters())
    router.replace(pathname, { scroll: false })
  }, [dispatch, pathname, router])

  return {
    query,
    categoryFilter,
    advancedFilters,
    setCategory,
    setSort,
    setViewMode,
    setMinRatingFilter,
    setInStockFilter,
    setFreeDeliveryFilter,
    setPriceRangeFilter,
    setSearch,
    updateSearchParams,
    clearAllFilters,
  }
}
