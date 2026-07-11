'use client'

import { cn } from '@/lib/utils/cn'
import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { isCatalogSyncPath, isProductsPath } from '@/i18n/locale-path'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setCategoryFilter } from '@/lib/store/slices/cartSlice'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { useCategories } from '@/hooks/use-categories'
import { queryRetryProps } from '@/lib/query/error-utils'
import { FilterCheckbox } from '@/components/ui/FilterCheckbox'
import { QueryErrorFallback } from '@/components/ui/QueryErrorFallback'

import type { CategoryTreeNode } from '@/lib/services/categories'
import { collectDescendantSlugs } from '@/lib/utils/category-tree'

interface CategoryFilterProps {
  variant?: 'pills' | 'cards'
  syncToUrl?: boolean
}

function descendantSlugs(node: CategoryTreeNode): string[] {
  return collectDescendantSlugs(node).filter((slug) => slug !== node.slug)
}

function CategoryFilterBranch({
  node,
  depth,
  expanded,
  setExpanded,
  active,
  applyCategory,
  isActive,
}: {
  node: CategoryTreeNode
  depth: number
  expanded: Record<string, boolean>
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  active: string
  applyCategory: (slug: string) => void
  isActive: (slug: string) => boolean
}) {
  const childSlugs = descendantSlugs(node)
  const open = expanded[node.slug] ?? (isActive(node.slug) || childSlugs.includes(active))
  const fallbackParent = node.parentId ? 'all' : 'all'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <FilterCheckbox
            id={`category-${node.slug}`}
            label={`${node.emoji ?? ''} ${node.name}`.trim()}
            meta={String(node.productCount)}
            checked={isActive(node.slug)}
            onChange={(checked) => {
              if (checked) applyCategory(node.slug)
              else if (isActive(node.slug)) applyCategory(fallbackParent)
            }}
          />
        </div>
        {node.children.length > 0 ? (
          <button
            type="button"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
            onClick={() => setExpanded((prev) => ({ ...prev, [node.slug]: !open }))}
            className="rounded-md p-1 text-slate-400 hover:bg-teal-50 hover:text-teal-700"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        ) : null}
      </div>

      {open && node.children.length > 0 ? (
        <div className="space-y-1 border-l border-teal-100 pl-3" style={{ marginLeft: `${depth * 0.75}rem` }}>
          {node.children.map((child) => (
            <CategoryFilterBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              active={active}
              applyCategory={applyCategory}
              isActive={isActive}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CategoryFilter({ variant = 'cards', syncToUrl = false }: CategoryFilterProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { setCategory } = useCatalogFilters()
  const active = useAppSelector((state) => state.cart.categoryFilter)
  const categoriesQuery = useCategories()
  const { data: tree = [], isLoading } = categoriesQuery
  const categoryError = queryRetryProps(categoriesQuery)
  const useUrl = syncToUrl || isProductsPath(pathname)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const totalCount = useMemo(() => tree.reduce((sum, node) => sum + node.productCount, 0), [tree])

  const applyCategory = (id: string) => {
    if (useUrl) {
      setCategory(id)
      return
    }
    dispatch(setCategoryFilter(id))
  }

  const isActive = (slug: string) => active === slug

  if (isLoading && tree.length === 0) {
    return <p className="text-xs text-slate-400">Loading categories…</p>
  }

  if (categoryError.hasError) {
    return (
      <QueryErrorFallback
        compact
        title="Categories unavailable"
        message={categoryError.message}
        onRetry={categoryError.retry}
      />
    )
  }

  if (variant === 'cards') {
    return (
      <div className="space-y-1">
        <FilterCheckbox
          id="category-all"
          label="All"
          meta={String(totalCount)}
          checked={active === 'all' || !active}
          onChange={(checked) => {
            if (checked) applyCategory('all')
          }}
        />

        {tree.map((node) => (
          <CategoryFilterBranch
            key={node.id}
            node={node}
            depth={1}
            expanded={expanded}
            setExpanded={setExpanded}
            active={active}
            applyCategory={applyCategory}
            isActive={isActive}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => applyCategory('all')}
        className={cn(
          'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
          active === 'all'
            ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
            : 'bg-white/70 text-slate-600 hover:bg-teal-50 hover:text-teal-700',
        )}>
        All <span className="opacity-70">({totalCount})</span>
      </button>
      {tree.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => applyCategory(node.slug)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
            active === node.slug
              ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
              : 'bg-white/70 text-slate-600 hover:bg-teal-50 hover:text-teal-700',
          )}>
          {node.name}
          <span className="ml-1 opacity-70">({node.productCount})</span>
        </button>
      ))}
    </div>
  )
}
