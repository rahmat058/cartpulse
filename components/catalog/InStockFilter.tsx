'use client'

import { usePathname } from 'next/navigation'
import { isProductsPath } from '@/i18n/locale-path'
import { Truck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setFreeDeliveryOnly, setInStockOnly } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { FilterCheckbox } from '@/components/ui/FilterCheckbox'

interface InStockFilterProps {
  syncToUrl?: boolean
}

export function InStockFilter({ syncToUrl = false }: InStockFilterProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setInStockFilter, setFreeDeliveryFilter } = useCatalogFilters()
  const { inStockOnly, freeDeliveryOnly } = useAppSelector(selectAdvancedFilters)
  const useUrl = syncToUrl || isProductsPath(pathname)

  return (
    <div className="space-y-2">
      <FilterCheckbox
        id="filter-in-stock"
        label="In stock only"
        description="Hide sold-out items"
        checked={inStockOnly}
        onChange={(checked) => {
          if (useUrl) {
            setInStockFilter(checked)
            return
          }
          dispatch(setInStockOnly(checked))
        }}
      />
      <FilterCheckbox
        id="filter-free-delivery"
        label="Free delivery"
        description="Orders $50 and above"
        icon={Truck}
        checked={freeDeliveryOnly}
        onChange={(checked) => {
          if (useUrl) {
            setFreeDeliveryFilter(checked)
            return
          }
          dispatch(setFreeDeliveryOnly(checked))
        }}
      />
    </div>
  )
}
