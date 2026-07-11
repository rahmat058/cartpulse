'use client'

import { useAppSelector } from '@/lib/store/hooks'
import {
  selectCatalogProducts,
  selectCatalogTotal,
} from '@/lib/store/selectors/cartSelectors'
import { CatalogViewToggle } from '@/components/catalog/CatalogViewToggle'

export function CatalogResultsBar({ visibleCount }: { visibleCount?: number }) {
  const products = useAppSelector(selectCatalogProducts)
  const total = useAppSelector(selectCatalogTotal)
  const shown = visibleCount ?? products.length

  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-teal-100/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing{' '}
        <span className="font-semibold text-slate-800">{shown}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span> products
      </p>

      <CatalogViewToggle />
    </div>
  )
}
