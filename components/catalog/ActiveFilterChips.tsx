'use client'

import { X } from 'lucide-react'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { useCategories } from '@/hooks/use-categories'
import { findCategoryInTree } from '@/lib/utils/category-tree'
import { getSortLabel } from '@/lib/utils/productCatalog'

export function ActiveFilterChips() {
  const {
    query,
    clearAllFilters,
    setCategory,
    setMinRatingFilter,
    setInStockFilter,
    setFreeDeliveryFilter,
    setSort,
    setSearch,
    updateSearchParams,
  } = useCatalogFilters()
  const { data: tree = [] } = useCategories()

  const categoryLabel = (() => {
    if (!query.category) return null
    const match = findCategoryInTree(query.category, tree)
    return match?.node.name ?? query.category
  })()

  const chips: Array<{ key: string; label: string; onClear: () => void }> = []

  if (query.category && query.category !== 'all') {
    chips.push({
      key: 'category',
      label: categoryLabel ?? query.category,
      onClear: () => setCategory('all'),
    })
  }

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    chips.push({
      key: 'price',
      label: `$${query.priceMin ?? 0}–$${query.priceMax ?? 0}`,
      onClear: () => updateSearchParams({ priceMin: null, priceMax: null }),
    })
  }

  if ((query.minRating ?? 0) > 0) {
    chips.push({
      key: 'rating',
      label: `${query.minRating}+ stars`,
      onClear: () => setMinRatingFilter(0),
    })
  }

  if (query.inStockOnly) {
    chips.push({
      key: 'stock',
      label: 'In stock',
      onClear: () => setInStockFilter(false),
    })
  }

  if (query.freeDeliveryOnly) {
    chips.push({
      key: 'delivery',
      label: 'Free delivery',
      onClear: () => setFreeDeliveryFilter(false),
    })
  }

  if (query.sortBy && query.sortBy !== 'name-asc') {
    chips.push({
      key: 'sort',
      label: getSortLabel(query.sortBy),
      onClear: () => setSort('name-asc'),
    })
  }

  if (query.search) {
    chips.push({
      key: 'search',
      label: `“${query.search}”`,
      onClear: () => setSearch(undefined),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-100">
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAllFilters}
        className="text-xs font-medium text-rose-500 dark:hover:text-slate-300">
        Clear all
      </button>
    </div>
  )
}
