'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils/cn'

export function ProductCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="border-border bg-card flex gap-4 rounded-md border p-3">
        <Skeleton className="size-28 shrink-0 rounded-md sm:size-32" />
        <div className="min-w-0 flex-1 space-y-3 py-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between gap-3 pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-md border">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  )
}

export function CatalogProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4', className)} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function CatalogFilterSidebarSkeleton({ showCategories = true }: { showCategories?: boolean }) {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>

      {showCategories ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className={cn('h-3', index % 2 === 0 ? 'w-28' : 'w-36')} />
              </div>
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="size-5 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  )
}

function CatalogFlashDealsHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-8 w-40 sm:w-52" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md lg:hidden" />
      </div>
      <Skeleton className="h-10 max-w-md rounded-md lg:hidden" />
    </div>
  )
}

function CatalogCategoryHeroSkeleton() {
  return (
    <div className="mb-6 space-y-4">
      <div className="overflow-hidden rounded-xl border border-teal-900/20 bg-linear-to-r from-teal-950 via-teal-900 to-cyan-950 p-6 sm:p-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-56 bg-white/15 sm:h-9 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-lg bg-white/10" />
          <Skeleton className="h-4 w-2/3 max-w-md bg-white/10" />
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-7 w-28 rounded-full bg-white/15" />
            <Skeleton className="h-7 w-36 rounded-full bg-white/15" />
            <Skeleton className="h-7 w-24 rounded-full bg-white/15" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-10 max-w-md rounded-md lg:hidden" />
    </div>
  )
}

function CatalogResultsHeaderSkeleton() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>
  )
}

export type CatalogPageSkeletonVariant = 'products' | 'category'

/**
 * Full catalog layout skeleton — matches `/products` (flash deals) and
 * `/products?category=…` (category hero + filters without category list).
 */
export function CatalogPageSkeleton({
  variant = 'products',
  className,
}: {
  variant?: CatalogPageSkeletonVariant
  className?: string
}) {
  const isCategory = variant === 'category'

  return (
    <div className={cn('space-y-0', className)} aria-busy="true" aria-label="Loading catalog">
      <Skeleton className="mb-4 h-4 w-48" />

      {isCategory ? <CatalogCategoryHeroSkeleton /> : <CatalogFlashDealsHeaderSkeleton />}

      <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <section className="glass-card hidden p-5 lg:sticky lg:top-32 lg:block lg:self-start">
          <CatalogFilterSidebarSkeleton showCategories={!isCategory} />
        </section>

        <section className="glass-card p-5 sm:p-6">
          <CatalogResultsHeaderSkeleton />
          <CatalogProductGridSkeleton count={8} />
        </section>
      </div>
    </div>
  )
}

/** @deprecated Prefer `CatalogPageSkeleton` or `CatalogProductGridSkeleton`. */
export function CatalogSkeleton() {
  return <CatalogProductGridSkeleton count={6} />
}
