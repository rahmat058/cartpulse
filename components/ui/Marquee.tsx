'use client'

import { cn } from '@/lib/utils/cn'
import { Children, type CSSProperties, type ReactNode } from 'react'

export interface MarqueeProps {
  children: ReactNode
  /** Full loop duration in seconds. Higher = slower. */
  duration?: number
  /** Scroll direction. */
  direction?: 'left' | 'right'
  /** Pause animation while hovered. */
  pauseOnHover?: boolean
  /** Tailwind gap class between items in each track copy. */
  gap?: string
  /** Minimum child count before infinite scroll runs. Below this, items stay in a static row. */
  minItems?: number
  className?: string
  trackClassName?: string
}

/** Tailwind gap-* → trailing padding so the loop seam matches item spacing. */
const GAP_TRAIL_PADDING: Record<string, string> = {
  'gap-2': '0.5rem',
  'gap-3': '0.75rem',
  'gap-4': '1rem',
  'gap-5': '1.25rem',
  'gap-6': '1.5rem',
}

function gapToTrailPadding(gap: string): string {
  return GAP_TRAIL_PADDING[gap] ?? '1rem'
}

export function Marquee({
  children,
  duration = 90,
  direction = 'left',
  pauseOnHover = true,
  gap = 'gap-4',
  minItems = 5,
  className,
  trackClassName,
}: MarqueeProps) {
  const items = Children.toArray(children)

  if (items.length < minItems) {
    return <div className={cn('flex flex-wrap py-1', gap, className)}>{items}</div>
  }

  const style = {
    '--marquee-duration': `${duration}s`,
  } as CSSProperties

  return (
    <div
      className={cn(
        'marquee overflow-hidden',
        pauseOnHover && 'marquee--pause-on-hover',
        direction === 'right' && 'marquee--reverse',
        className,
      )}
      style={style}>
      <div className={cn('marquee-track flex w-max py-1', trackClassName)}>
        {[0, 1].map((set) => (
          <div
            key={set}
            className={cn('flex shrink-0', gap)}
            style={{ paddingRight: gapToTrailPadding(gap) }}
            aria-hidden={set === 1 ? true : undefined}>
            {items}
          </div>
        ))}
      </div>
    </div>
  )
}
