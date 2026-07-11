'use client'

import type { ReactNode } from 'react'
import { LottieIllustration } from '@/components/lottie/LottieIllustration'
import { cn } from '@/lib/utils/cn'

/** 404 / error hero with `404` Lottie and action buttons. */
export function NotFoundPanel({
  badge,
  title,
  description,
  meta,
  actions,
  badgeTone = 'teal',
  className,
}: {
  badge: string
  title: string
  description: string
  meta?: string
  actions: ReactNode
  badgeTone?: 'teal' | 'rose'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center sm:py-24', className)}>
      <LottieIllustration kind="404" size="xl" />
      <p
        className={cn(
          'mt-4 text-sm font-semibold tracking-widest uppercase',
          badgeTone === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400',
        )}>
        {badge}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 sm:text-base">{description}</p>
      {meta ? <p className="mt-2 font-mono text-xs text-slate-400">{meta}</p> : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </div>
  )
}
