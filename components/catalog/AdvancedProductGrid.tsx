'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
  selectCatalogProducts,
  selectAdvancedFilters,
  selectCategoryFilter,
  selectCatalogPriceBounds,
} from '@/lib/store/selectors/cartSelectors'
import { appendCatalogFromQuery } from '@/lib/store/slices/cartSlice'
import { CatalogResultsBar } from '@/components/catalog/CatalogResultsBar'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Button } from '@/components/ui/Button'
import { NoResultsPanel } from '@/components/lottie/NoResultsPanel'
import { cn } from '@/lib/utils/cn'
import { fetchProducts } from '@/lib/services/products-client'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { CATALOG_DEFAULT_PAGE_SIZE, type CatalogQueryParams } from '@/types/cart'

export const CATEGORY_PRODUCT_PAGE_SIZE = CATALOG_DEFAULT_PAGE_SIZE

interface AdvancedProductGridProps {
  onBuyNow?: () => void
  paginated?: boolean
  /** When set (e.g. store page), used for server load-more instead of URL-only filters. */
  query?: CatalogQueryParams
}

export function AdvancedProductGrid({
  onBuyNow,
  paginated = false,
  query: queryProp,
}: AdvancedProductGridProps) {
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectCatalogProducts)
  const categoryFilter = useAppSelector(selectCategoryFilter)
  const catalogBounds = useAppSelector(selectCatalogPriceBounds)
  const advancedFilters = useAppSelector(selectAdvancedFilters)
  const catalogMeta = useAppSelector((state) => state.cart.meta)
  const searchParams = useSearchParams()
  const { query: urlQuery } = useCatalogFilters()
  const query = queryProp ?? urlQuery
  const { viewMode } = advancedFilters
  const isList = viewMode === 'list'
  const [loadingMore, setLoadingMore] = useState(false)

  const hasActiveFilters = useMemo(() => {
    const search = searchParams.get('search')?.trim()
    const store = searchParams.get('store')?.trim()
    const categoryParam = searchParams.get('category')
    const hasCategoryFilter =
      (categoryParam != null && categoryParam !== 'all') ||
      (categoryFilter !== 'all' && categoryParam == null)

    return Boolean(
      search ||
      store ||
      query.storeSlug ||
      hasCategoryFilter ||
      advancedFilters.minRating > 0 ||
      advancedFilters.inStockOnly ||
      advancedFilters.freeDeliveryOnly ||
      advancedFilters.priceMin > catalogBounds.min ||
      advancedFilters.priceMax < catalogBounds.max ||
      searchParams.get('inStock') === 'true' ||
      searchParams.get('freeDelivery') === 'true' ||
      searchParams.get('minRating') ||
      searchParams.get('priceMin') ||
      searchParams.get('priceMax'),
    )
  }, [advancedFilters, catalogBounds.max, catalogBounds.min, categoryFilter, query.storeSlug, searchParams])

  useEffect(() => {
    setLoadingMore(false)
  }, [categoryFilter, query.storeSlug, query.search, query.sortBy, query.priceMin, query.priceMax])

  const nextCursor = catalogMeta?.nextCursor ?? null
  const canLoadMore = paginated && Boolean(catalogMeta?.hasMore && nextCursor)

  async function handleLoadMore() {
    if (loadingMore || !paginated) return
    const cursor = catalogMeta?.nextCursor
    if (!cursor) return

    setLoadingMore(true)
    try {
      const payload = await fetchProducts({
        ...query,
        cursor,
        pageSize: catalogMeta?.pageSize ?? query.pageSize ?? CATALOG_DEFAULT_PAGE_SIZE,
      })
      dispatch(appendCatalogFromQuery(payload))
    } catch {
      // Keep current grid; user can retry.
    } finally {
      setLoadingMore(false)
    }
  }

  if (products.length === 0) {
    return (
      <>
        <CatalogResultsBar />
        {hasActiveFilters ? (
          <NoResultsPanel
            title="No products match your filters"
            description="Try adjusting price range, category, or search terms."
            size="lg"
          />
        ) : (
          <p className="py-16 text-center text-sm text-slate-400">No products available right now.</p>
        )}
      </>
    )
  }

  return (
    <div>
      <CatalogResultsBar visibleCount={paginated ? products.length : undefined} />

      <div
        className={cn(
          isList ? 'flex flex-col gap-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
        )}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            layout={isList ? 'catalog-list' : 'catalog-grid'}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>

      {canLoadMore ? (
        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            size="lg"
            loading={loadingMore}
            onClick={() => void handleLoadMore()}
            className={cn(
              'relative min-w-[180px] overflow-hidden border-transparent px-8',
              'bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500 text-white',
              'shadow-lg shadow-teal-500/30 transition-all duration-300',
              'hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-500/40',
              'dark:shadow-teal-500/20 dark:hover:shadow-teal-500/30',
              'before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:opacity-0 before:transition-opacity hover:before:opacity-100',
            )}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
