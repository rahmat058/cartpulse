'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import { queryRetryProps } from '@/lib/query/error-utils'
import { QueryErrorFallback } from '@/components/ui/QueryErrorFallback'
import { cn } from '@/lib/utils/cn'

function CategoryLink({
  href,
  label,
  active,
  hasChildren,
  onHover,
  onNavigate,
}: {
  href: string
  label: string
  active: boolean
  hasChildren?: boolean
  onHover?: () => void
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      onClick={onNavigate}
      className={cn(
        'flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors',
        active
          ? 'bg-white font-semibold text-teal-700 dark:bg-slate-950 dark:text-teal-300'
          : 'text-slate-600 hover:bg-white/80 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300',
      )}
    >
      <span className="truncate">{label}</span>
      {hasChildren ? <ChevronRight className="size-4 shrink-0 opacity-60" /> : null}
    </Link>
  )
}

export function CategoryMegaMenu() {
  const [open, setOpen] = useState(false)
  const categoriesQuery = useCategories()
  const { data: categories = [] } = categoriesQuery
  const categoryError = queryRetryProps(categoriesQuery)
  const [activeRootSlug, setActiveRootSlug] = useState<string | null>(null)
  const [activeChildSlug, setActiveChildSlug] = useState<string | null>(null)

  const activeRoot =
    categories.find((category) => category.slug === (activeRootSlug ?? categories[0]?.slug)) ??
    categories[0]

  const activeChild =
    activeRoot?.children.find((child) => child.slug === activeChildSlug) ??
    activeRoot?.children[0] ??
    null

  if (categoryError.hasError) {
    return (
      <div className="hidden lg:block">
        <QueryErrorFallback
          compact
          title="Categories unavailable"
          message={categoryError.message}
          onRetry={categoryError.retry}
          className="max-w-xs"
        />
      </div>
    )
  }

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-300 dark:border-teal-800 dark:bg-slate-900 dark:text-slate-200"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Menu className="h-4 w-4 text-teal-600" />
        All Categories
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && activeRoot && (
        <div className="absolute top-full left-0 z-50 w-[min(980px,calc(100vw-2rem))] pt-2">
          <div className="flex overflow-hidden rounded-md border border-teal-100 bg-white shadow-2xl shadow-teal-500/10 dark:border-slate-800 dark:bg-slate-950">
            <ul className="w-56 shrink-0 border-r border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onMouseEnter={() => {
                      setActiveRootSlug(category.slug)
                      setActiveChildSlug(category.children[0]?.slug ?? null)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors',
                      activeRoot.slug === category.slug
                        ? 'bg-white font-semibold text-teal-700 dark:bg-slate-950 dark:text-teal-300'
                        : 'text-slate-600 hover:bg-white/80 dark:text-slate-300',
                    )}
                  >
                    <span className="truncate">
                      {category.emoji ? `${category.emoji} ` : ''}
                      {category.name}
                    </span>
                    {category.children.length > 0 ? (
                      <ChevronRight className="size-4 shrink-0 opacity-60" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>

            <ul className="w-56 shrink-0 border-r border-slate-100 dark:border-slate-800">
              {activeRoot.children.length > 0 ? (
                activeRoot.children.map((child) => (
                  <li key={child.id}>
                    <CategoryLink
                      href={`/products?category=${child.slug}`}
                      label={`${child.emoji ? `${child.emoji} ` : ''}${child.name}`}
                      active={activeChild?.slug === child.slug}
                      hasChildren={child.children.length > 0}
                      onHover={() => setActiveChildSlug(child.slug)}
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-sm text-muted-foreground">No subcategories yet.</li>
              )}
            </ul>

            <div className="grid min-w-0 flex-1 gap-6 p-6 sm:grid-cols-[1fr_220px]">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {activeChild?.name ?? activeRoot.name}
                </h3>

                {activeChild && activeChild.children.length > 0 ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {activeChild.children.map((leaf) => (
                      <li key={leaf.id}>
                        <Link
                          href={`/products?category=${leaf.slug}`}
                          className="text-sm text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                          onClick={() => setOpen(false)}
                        >
                          {leaf.emoji ? `${leaf.emoji} ` : ''}
                          {leaf.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Browse products in this category or explore related items.
                  </p>
                )}

                <Link
                  href={`/products?category=${activeChild?.slug ?? activeRoot.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-teal-600 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View all {activeChild?.name ?? activeRoot.name} →
                </Link>
              </div>

              <div className="rounded-md bg-linear-to-br from-teal-700 to-cyan-700 p-4 text-white">
                <p className="text-sm font-bold">Explore {activeRoot.name}</p>
                <p className="mt-2 text-xs text-teal-50/90">
                  {activeRoot.productCount} products · 3-level categories · Fast delivery.
                </p>
                <Link
                  href={`/products?category=${activeRoot.slug}`}
                  className="mt-4 inline-flex rounded-md bg-white px-3 py-1.5 text-xs font-bold text-teal-800"
                  onClick={() => setOpen(false)}
                >
                  Shop {activeRoot.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
