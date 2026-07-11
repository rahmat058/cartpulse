import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/80 dark:bg-muted/40', className)}
      {...props}
    />
  )
}
