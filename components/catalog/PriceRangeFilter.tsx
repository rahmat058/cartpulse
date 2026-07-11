'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { isProductsPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setPriceRange } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters, selectCatalogPriceBounds } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { DualRangeSlider } from '@/components/catalog/DualRangeSlider'
import { cn } from '@/lib/utils/cn'

function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

interface PriceRangeFilterProps {
  syncToUrl?: boolean
}

export function PriceRangeFilter({ syncToUrl = false }: PriceRangeFilterProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setPriceRangeFilter } = useCatalogFilters()
  const { priceMin, priceMax } = useAppSelector(selectAdvancedFilters)
  const bounds = useAppSelector(selectCatalogPriceBounds)
  const useUrl = syncToUrl || isProductsPath(pathname)

  const [activeField, setActiveField] = useState<'min' | 'max' | null>(null)
  const [draft, setDraft] = useState('')

  const minDisplay = activeField === 'min' ? draft : String(priceMin)
  const maxDisplay = activeField === 'max' ? draft : String(priceMax)

  const commitRange = (min: number, max: number) => {
    const nextMin = Math.max(bounds.min, Math.min(min, max))
    const nextMax = Math.min(bounds.max, Math.max(min, max))
    if (useUrl) {
      setPriceRangeFilter(nextMin, nextMax)
      return
    }
    dispatch(setPriceRange({ min: nextMin, max: nextMax }))
  }

  const handleSliderChange = (min: number, max: number) => {
    if (useUrl) {
      setPriceRangeFilter(min, max)
    } else {
      dispatch(setPriceRange({ min, max }))
    }
    if (activeField === 'min') setActiveField(null)
    if (activeField === 'max') setActiveField(null)
  }

  return (
    <div className="space-y-4">
      <DualRangeSlider
        min={bounds.min}
        max={bounds.max}
        valueMin={priceMin}
        valueMax={priceMax}
        onChange={handleSliderChange}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Min</span>
          <input
            type="text"
            inputMode="decimal"
            value={minDisplay}
            onFocus={() => {
              setActiveField('min')
              setDraft(String(priceMin))
            }}
            onBlur={() => {
              const parsed = parsePriceInput(draft)
              if (parsed !== null) commitRange(parsed, priceMax)
              setActiveField(null)
            }}
            onChange={(event) => setDraft(event.target.value)}
            className={cn(
              'w-full rounded-md border border-teal-200 bg-white/80 px-3 py-2 text-sm tabular-nums text-slate-700',
              'outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
            )}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-slate-500">Max</span>
          <input
            type="text"
            inputMode="decimal"
            value={maxDisplay}
            onFocus={() => {
              setActiveField('max')
              setDraft(String(priceMax))
            }}
            onBlur={() => {
              const parsed = parsePriceInput(draft)
              if (parsed !== null) commitRange(priceMin, parsed)
              setActiveField(null)
            }}
            onChange={(event) => setDraft(event.target.value)}
            className={cn(
              'w-full rounded-md border border-teal-200 bg-white/80 px-3 py-2 text-sm tabular-nums text-slate-700',
              'outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
            )}
          />
        </label>
      </div>

      <p className="text-center text-xs text-slate-400">
        {formatCurrency(priceMin)} – {formatCurrency(priceMax)}
      </p>
    </div>
  )
}
