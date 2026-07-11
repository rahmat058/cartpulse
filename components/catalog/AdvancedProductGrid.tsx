'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/lib/store/hooks'
import {
  selectCatalogProducts,
  selectAdvancedFilters,
  selectCategoryFilter,
  selectCatalogPriceBounds,
} from '@/lib/store/selectors/cartSelectors'
import { CatalogResultsBar } from '@/components/catalog/CatalogResultsBar'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Button } from '@/components/ui/Button'
import { NoResultsPanel } from '@/components/lottie/NoResultsPanel'
import { cn } from '@/lib/utils/cn'

export const CATEGORY_PRODUCT_PAGE_SIZE = 12

interface AdvancedProductGridProps {
  onBuyNow?: () => void
  paginated?: boolean
  pageSize?: number
}

export function AdvancedProductGrid({
  onBuyNow,
  paginated = false,
  pageSize = CATEGORY_PRODUCT_PAGE_SIZE,
}: AdvancedProductGridProps) {
  const products = useAppSelector(selectCatalogProducts)
  const categoryFilter = useAppSelector(selectCategoryFilter)
  const catalogResultIds = useAppSelector((state) => state.cart.catalogResultIds)
  const catalogBounds = useAppSelector(selectCatalogPriceBounds)
  const advancedFilters = useAppSelector(selectAdvancedFilters)
  const searchParams = useSearchParams()
  const { viewMode } = advancedFilters
  const isList = viewMode === 'list'
  const [visibleCount, setVisibleCount] = useState(pageSize)
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
  }, [advancedFilters, catalogBounds.max, catalogBounds.min, categoryFilter, searchParams])

  useEffect(() => {
    setVisibleCount(pageSize)
    setLoadingMore(false)
  }, [categoryFilter, pageSize, catalogResultIds, paginated])

  function handleLoadMore() {
    setLoadingMore(true)
    window.setTimeout(() => {
      setVisibleCount((count) => count + pageSize)
      setLoadingMore(false)
    }, 400)
  }

  const visibleProducts = paginated ? products.slice(0, visibleCount) : products
  const canLoadMore = paginated && products.length > pageSize && visibleCount < products.length

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
      <CatalogResultsBar visibleCount={paginated ? visibleProducts.length : undefined} />

      <div
        className={cn(
          isList ? 'flex flex-col gap-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
        )}
      >
        {visibleProducts.map((product, index) => (
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
            onClick={handleLoadMore}
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
