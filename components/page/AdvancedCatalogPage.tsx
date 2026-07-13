'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Filter, Layers, SlidersHorizontal, X, Zap } from 'lucide-react'
import { useAppSelector } from '@/lib/store/hooks'
import {
  selectCatalogError,
  selectCatalogProducts,
  selectCatalogStatus,
  selectCategoryFilter,
  selectCatalogTotal,
} from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { useCatalogLoader } from '@/hooks/useCatalogLoader'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import { useCategories } from '@/hooks/use-categories'
import { resolveCategoryPageContext } from '@/lib/catalog/category-context'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { CatalogSearch } from '@/components/catalog/CatalogSearch'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import { CategoryHeroBanner } from '@/components/catalog/CategoryHeroBanner'
import { RelatedCategories } from '@/components/catalog/RelatedCategories'
import { ActiveFilterChips } from '@/components/catalog/ActiveFilterChips'
import { AdvancedProductGrid } from '@/components/catalog/AdvancedProductGrid'
import {
  CatalogPageSkeleton,
  CatalogProductGridSkeleton,
  type CatalogPageSkeletonVariant,
} from '@/components/catalog/CatalogSkeleton'
import { CatalogError } from '@/components/catalog/CatalogError'
import { Button } from '@/components/ui/Button'

const TIPS = [
  { icon: SlidersHorizontal, text: 'URL-synced filters' },
  { icon: Filter, text: 'Server-side Prisma queries' },
  { icon: Layers, text: 'Grid or list view' },
]

function resolveSkeletonVariant(category: string | null | undefined): CatalogPageSkeletonVariant {
  if (category && category !== 'all') return 'category'
  return 'products'
}

export function AdvancedCatalogPage() {
  const catalogStatus = useAppSelector(selectCatalogStatus)
  const catalogError = useAppSelector(selectCatalogError)
  const categoryFilter = useAppSelector(selectCategoryFilter)
  const catalogTotal = useAppSelector(selectCatalogTotal)
  const catalogProducts = useAppSelector(selectCatalogProducts)
  const { query } = useCatalogFilters()
  const searchParams = useSearchParams()
  const { data: categoryTree = [] } = useCategories()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { refetchCatalog } = useCatalogLoader(query)
  const { openCart } = useCartDrawer()

  const skeletonVariant = resolveSkeletonVariant(
    searchParams.get('category') ?? (categoryFilter !== 'all' ? categoryFilter : null),
  )

  const isInitialLoading = catalogStatus === 'loading' && catalogProducts.length === 0
  const isRefetching = catalogStatus === 'loading' && catalogProducts.length > 0
  const showCatalog = catalogStatus === 'succeeded' || isRefetching

  const categoryContext = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') return null
    return resolveCategoryPageContext(categoryFilter, categoryTree)
  }, [categoryFilter, categoryTree])

  const categoryTitle =
    categoryContext?.current.name ??
    (() => {
      if (!categoryFilter || categoryFilter === 'all') return 'Flash deals'
      for (const node of categoryTree) {
        if (node.slug === categoryFilter) return node.name
        const child = node.children.find((c) => c.slug === categoryFilter)
        if (child) return `${node.name} · ${child.name}`
      }
      return categoryFilter
    })()

  return (
    <>
      <StorefrontContainer as="main" className="py-8">
        <Breadcrumbs
          className="mb-4"
          items={
            categoryContext?.breadcrumbs ?? [
              { label: 'Home', href: '/' },
              { label: 'Search', href: '/products' },
              { label: categoryTitle },
            ]
          }
        />

        {isInitialLoading ? (
          <CatalogPageSkeleton variant={skeletonVariant} />
        ) : (
          <>
            {categoryContext ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <CategoryHeroBanner context={categoryContext} productTotal={catalogTotal} />
                <RelatedCategories categories={categoryContext.relatedCategories} />
                <div className="mt-4 max-w-md lg:hidden">
                  <CatalogSearch />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-6 w-6 text-teal-600" />
                      <h1 className="bg-linear-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                        {categoryTitle}
                      </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {catalogTotal} product{catalogTotal === 1 ? '' : 's'} on sale right now
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
                <div className="mt-4 max-w-md lg:hidden">
                  <CatalogSearch />
                </div>
              </motion.div>
            )}

            {categoryContext ? (
              <div className="mb-4 flex justify-end lg:hidden">
                <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            ) : null}

            {catalogStatus === 'failed' && catalogError ? (
              <CatalogError message={catalogError} onRetry={() => refetchCatalog()} />
            ) : null}

            {showCatalog ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]"
              >
                <section
                  className="glass-card hidden p-5 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto"
                  aria-label="Filters"
                >
                  <CatalogToolbar hideCategoryFilter={Boolean(categoryContext)} />
                </section>

                <section className="glass-card p-5 sm:p-6" aria-label="Filtered products">
                  {isRefetching ? (
                    <>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="h-7 w-40 animate-pulse rounded-full bg-muted/80" />
                        <div className="h-4 w-36 animate-pulse rounded bg-muted/80" />
                      </div>
                      <CatalogProductGridSkeleton count={8} />
                    </>
                  ) : (
                    <>
                      <ActiveFilterChips />
                      <AdvancedProductGrid onBuyNow={openCart} paginated query={query} />
                    </>
                  )}
                </section>
              </motion.div>
            ) : null}
          </>
        )}

        <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-4">
          {TIPS.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className="h-3.5 w-3.5 text-teal-400" />
              {text}
            </span>
          ))}
        </div>
      </StorefrontContainer>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white shadow-xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Filters</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CatalogToolbar hideCategoryFilter={Boolean(categoryContext)} />
            </div>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
