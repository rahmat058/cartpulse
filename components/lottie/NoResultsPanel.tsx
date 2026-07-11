'use client'

import type { ReactNode } from 'react'
import { LottieIllustration } from '@/components/lottie/LottieIllustration'
import type { LottieSize } from '@/components/lottie/lottie-sources'
import { cn } from '@/lib/utils/cn'

/** Empty / no-results state with `no-result-found` Lottie. */
export function NoResultsPanel({
  title,
  description,
  action,
  size = 'md',
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  size?: LottieSize
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-10 text-center sm:py-12', className)}>
      <LottieIllustration kind="no-result" size={size} />
      <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
