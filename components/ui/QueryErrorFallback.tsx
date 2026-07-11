'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { OctagonX, RotateCcw } from 'lucide-react'

interface QueryErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void
  compact?: boolean
  className?: string
}

export function QueryErrorFallback({
  title = 'Failed to load',
  message = 'A network or server error occurred. Please try again.',
  onRetry,
  compact = false,
  className,
}: QueryErrorFallbackProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border border-rose-100 bg-rose-50/50 px-3 py-2 text-left dark:border-rose-900/40 dark:bg-rose-950/30',
          className,
        )}
        role="alert">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-rose-100 to-red-100 text-rose-600 dark:from-rose-950 dark:to-red-950 dark:text-rose-400">
          <OctagonX className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          <p className="truncate text-[11px] text-slate-500">{message}</p>
        </div>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
            Retry
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('glass-card flex flex-col items-center gap-3 p-8 text-center', className)} role="alert">
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-linear-to-br from-rose-100 to-red-100 text-rose-600 dark:from-rose-950 dark:to-red-950 dark:text-rose-400">
        <OctagonX className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
