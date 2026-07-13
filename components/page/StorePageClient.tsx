'use client'

import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SlidersHorizontal, X } from 'lucide-react'
import { useAppSelector } from '@/lib/store/hooks'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { useCatalogLoader } from '@/hooks/useCatalogLoader'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import type { StoreProfile } from '@/lib/services/stores'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { StoreHeroBanner } from '@/components/storefront/StoreHeroBanner'
import { RichTextContent } from '@/components/shared/RichTextContent'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import { ActiveFilterChips } from '@/components/catalog/ActiveFilterChips'
import { AdvancedProductGrid } from '@/components/catalog/AdvancedProductGrid'
import { CatalogBrowseLayoutSkeleton } from '@/components/catalog/CatalogSkeleton'
import { CatalogError } from '@/components/catalog/CatalogError'
import { selectCatalogError, selectCatalogStatus } from '@/lib/store/selectors/cartSelectors'

type StoreTab = 'products' | 'about' | 'reviews'

export function StorePageClient({ store }: { store: StoreProfile }) {
  const catalogStatus = useAppSelector(selectCatalogStatus)
  const catalogError = useAppSelector(selectCatalogError)
  const { query: urlQuery } = useCatalogFilters()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<StoreTab>('products')
  const { openCart } = useCartDrawer()

  const query = useMemo(
    () => ({
      ...urlQuery,
      storeSlug: store.slug,
      category: undefined,
    }),
    [urlQuery, store.slug],
  )

  const { refetchCatalog } = useCatalogLoader(query)

  const tabs: Array<{ id: StoreTab; label: string; count?: number }> = [
    { id: 'products', label: 'All Products', count: store.productCount },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews', count: store.reviewCount || undefined },
  ]

  return (
    <>
      <StorefrontContainer as="main" className="py-8">
        <Breadcrumbs
          className="mb-4"
          items={[{ label: 'Home', href: '/' }, { label: 'Stores', href: '/stores' }, { label: store.name }]}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6">
          <StoreHeroBanner store={store} />
        </motion.div>

        <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'shrink-0 border-b-2 pb-3 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                )}>
                {tab.label}
                {tab.count !== undefined ? ` (${tab.count})` : ''}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'about' && (
          <div className="glass-card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">About {store.name}</h2>
            {store.description ? (
              <RichTextContent html={store.description} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-slate-500">This store has not added a description yet.</p>
            )}
            {store.supportEmail ? (
              <p className="mt-4 text-sm text-slate-500">
                Support:{' '}
                <a href={`mailto:${store.supportEmail}`} className="font-medium text-teal-700 hover:underline">
                  {store.supportEmail}
                </a>
              </p>
            ) : null}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="glass-card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Store reviews</h2>
            <p className="mt-3 text-sm text-slate-500">
              {store.reviewCount > 0
                ? `${store.reviewCount} customer review${store.reviewCount === 1 ? '' : 's'} · average rating ${store.averageRating.toFixed(1)}.`
                : 'No customer reviews yet for this store.'}
            </p>
          </div>
        )}

        {activeTab === 'products' && (
          <>
            <div className="mb-4 flex justify-end lg:hidden">
              <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {catalogStatus === 'loading' && (
              <CatalogBrowseLayoutSkeleton showCategories={false} />
            )}

            {catalogStatus === 'failed' && catalogError && (
              <CatalogError message={catalogError} onRetry={() => refetchCatalog()} />
            )}

            {catalogStatus === 'succeeded' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
                <section
                  className="glass-card hidden p-5 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto"
                  aria-label="Filters">
                  <CatalogToolbar hideCategoryFilter />
                </section>

                <section className="glass-card p-5 sm:p-6" aria-label="Store products">
                  <ActiveFilterChips />
                  <AdvancedProductGrid onBuyNow={openCart} paginated query={query} />
                </section>
              </motion.div>
            )}
          </>
        )}
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
                aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CatalogToolbar hideCategoryFilter />
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
