import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

/** PDP skeleton — gallery + buy box + tabs (not the catalog grid). */
export function ProductDetailSkeleton({ className }: { className?: string }) {
  return (
    <StorefrontContainer as="main" className={cn('py-8', className)} aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-6 h-4 w-64 max-w-full" />

      <div className="border-border bg-card overflow-hidden rounded-md border shadow-sm">
        <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
          <div>
            <Skeleton className="aspect-square w-full rounded-md" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="size-14 rounded-md" />
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <Skeleton className="h-8 w-4/5 max-w-md" />
            <Skeleton className="h-4 w-36" />
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
            <Skeleton className="h-16 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-11 flex-1 rounded-md sm:max-w-[180px]" />
              <Skeleton className="h-11 flex-1 rounded-md sm:max-w-[140px]" />
              <Skeleton className="size-11 rounded-md" />
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
              <Skeleton className="h-16 rounded-md" />
              <Skeleton className="h-16 rounded-md" />
              <Skeleton className="h-16 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="border-border flex gap-4 border-b pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </StorefrontContainer>
  )
}

/**
 * Generic storefront page skeleton for routes without a dedicated loading UI
 * (help, about, stores index, etc.).
 */
export function StorefrontPageSkeleton({ className }: { className?: string }) {
  return (
    <StorefrontContainer
      as="main"
      className={cn('space-y-8 py-8', className)}
      aria-busy="true"
      aria-label="Loading page">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border-border bg-card space-y-3 rounded-md border p-4">
            <Skeleton className="aspect-4/3 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </StorefrontContainer>
  )
}
