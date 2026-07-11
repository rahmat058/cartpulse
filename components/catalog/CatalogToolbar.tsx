'use client'

import { RotateCcw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { isCatalogSyncPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { resetAdvancedFilters } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters, selectCatalogTotal } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { CategoryFilter } from '@/components/catalog/CategoryFilter'
import { PriceRangeFilter } from '@/components/catalog/PriceRangeFilter'
import { SortSelect } from '@/components/catalog/SortSelect'
import { RatingFilter } from '@/components/catalog/RatingFilter'
import { InStockFilter } from '@/components/catalog/InStockFilter'
import { getSortLabel } from '@/lib/utils/productCatalog'
import { Button } from '@/components/ui/Button'

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-teal-100/80 pb-5">
      <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
      {children}
    </section>
  )
}

interface CatalogToolbarProps {
  hideCategoryFilter?: boolean
  syncToUrl?: boolean
}

export function CatalogToolbar({ hideCategoryFilter = false, syncToUrl: syncToUrlProp }: CatalogToolbarProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const catalogTotal = useAppSelector(selectCatalogTotal)
  const { sortBy } = useAppSelector(selectAdvancedFilters)
  const { clearAllFilters } = useCatalogFilters()
  const syncToUrl = syncToUrlProp ?? isCatalogSyncPath(pathname)

  const handleReset = () => {
    if (syncToUrl) {
      clearAllFilters()
      return
    }
    dispatch(resetAdvancedFilters())
  }

  return (
    <aside className="space-y-5" aria-label="Catalog filters">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="px-2! py-1! text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        {catalogTotal} result{catalogTotal === 1 ? '' : 's'}
        {sortBy !== 'name-asc' ? ` · ${getSortLabel(sortBy)}` : ''}
      </p>

      {!hideCategoryFilter ? (
        <FilterSection title="Category">
          <CategoryFilter syncToUrl={syncToUrl} />
        </FilterSection>
      ) : null}

      <FilterSection title="Price">
        <PriceRangeFilter syncToUrl={syncToUrl} />
      </FilterSection>

      <FilterSection title="Sort">
        <SortSelect syncToUrl={syncToUrl} />
      </FilterSection>

      <FilterSection title="Rating">
        <RatingFilter syncToUrl={syncToUrl} />
      </FilterSection>

      <FilterSection title="Availability">
        <InStockFilter syncToUrl={syncToUrl} />
      </FilterSection>
    </aside>
  )
}
