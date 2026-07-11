'use client'

import { usePathname } from 'next/navigation'
import { isProductsPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setSortBy } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import type { CatalogSortBy } from '@/types/cart'
import { SORT_OPTIONS } from '@/lib/utils/productCatalog'
import { cn } from '@/lib/utils/cn'

interface SortSelectProps {
  hideLabel?: boolean
  syncToUrl?: boolean
}

export function SortSelect({ hideLabel = false, syncToUrl = false }: SortSelectProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setSort } = useCatalogFilters()
  const { sortBy } = useAppSelector(selectAdvancedFilters)
  const useUrl = syncToUrl || isProductsPath(pathname)

  return (
    <div className="space-y-2">
      <label
        htmlFor="sort-by"
        className={cn('text-xs font-semibold text-slate-700', hideLabel && 'sr-only')}
      >
        Sort by
      </label>
      <select
        id="sort-by"
        value={sortBy}
        onChange={(event) => {
          const value = event.target.value as CatalogSortBy
          if (useUrl) {
            setSort(value)
            return
          }
          dispatch(setSortBy(value))
        }}
        className={cn(
          'w-full rounded-md border border-teal-200 bg-white/80 px-3 py-2 text-sm text-slate-700',
          'outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
        )}
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
