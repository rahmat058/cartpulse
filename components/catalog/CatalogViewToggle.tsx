'use client'

import { LayoutGrid, List } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { isProductsPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setCatalogViewMode } from '@/lib/store/slices/cartSlice'
import { selectAdvancedFilters } from '@/lib/store/selectors/cartSelectors'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import type { CatalogViewMode } from '@/types/cart'
import { cn } from '@/lib/utils/cn'

const MODES: { id: CatalogViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { id: 'list', icon: List, label: 'List view' },
]

export function CatalogViewToggle() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setViewMode } = useCatalogFilters()
  const { viewMode } = useAppSelector(selectAdvancedFilters)
  const useUrl = isProductsPath(pathname)

  const applyView = (id: CatalogViewMode) => {
    if (useUrl) {
      setViewMode(id)
      return
    }
    dispatch(setCatalogViewMode(id))
  }

  return (
    <div
      className="flex rounded-md border border-teal-200/80 bg-white/80 p-1"
      role="group"
      aria-label="Catalog view mode"
    >
      {MODES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => applyView(id)}
          aria-label={label}
          aria-pressed={viewMode === id}
          className={cn(
            'rounded-md p-2 transition-all duration-200',
            viewMode === id
              ? 'bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/25'
              : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700',
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
