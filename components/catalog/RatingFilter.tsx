'use client'

import { Star } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { isProductsPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setMinRating } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { cn } from '@/lib/utils/cn'

const RATING_OPTIONS = [
  { value: 5, filled: 5, showAndUp: false },
  { value: 4, filled: 4, showAndUp: true },
  { value: 3, filled: 3, showAndUp: true },
  { value: 2, filled: 2, showAndUp: true },
  { value: 1, filled: 1, showAndUp: true },
] as const

function StarRatingRow({ filled, showAndUp }: { filled: number; showAndUp: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              'size-4',
              index < filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700',
            )}
          />
        ))}
      </span>
      {showAndUp ? <span className="text-sm text-slate-500 dark:text-slate-400">And Up</span> : null}
    </span>
  )
}

interface RatingFilterProps {
  syncToUrl?: boolean
}

export function RatingFilter({ syncToUrl = false }: RatingFilterProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setMinRatingFilter } = useCatalogFilters()
  const { minRating } = useAppSelector(selectAdvancedFilters)
  const useUrl = syncToUrl || isProductsPath(pathname)

  const applyRating = (value: number) => {
    const nextValue = minRating === value ? 0 : value
    if (useUrl) {
      setMinRatingFilter(nextValue)
      return
    }
    dispatch(setMinRating(nextValue))
  }

  return (
    <div className="space-y-0.5">
      {RATING_OPTIONS.map(({ value, filled, showAndUp }) => {
        const selected = minRating === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={`${value} star${value === 1 ? '' : 's'} and up`}
            onClick={() => applyRating(value)}
            className={cn(
              'flex w-full items-center rounded-md px-2 py-2 text-left transition-colors',
              selected
                ? 'bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100'
                : 'hover:bg-teal-50/80 dark:hover:bg-teal-950/30',
            )}
          >
            <StarRatingRow filled={filled} showAndUp={showAndUp} />
          </button>
        )
      })}
    </div>
  )
}
