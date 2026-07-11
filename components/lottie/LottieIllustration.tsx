'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { cn } from '@/lib/utils/cn'
import {
  LOTTIE_SIZE_PX,
  LOTTIE_SOURCES,
  type LottieKind,
  type LottieSize,
} from '@/components/lottie/lottie-sources'

/** Square Lottie player — fixed aspect ratio, no stretch. */
export function LottieIllustration({
  kind,
  size = 'md',
  className,
  loop = true,
}: {
  kind: LottieKind
  size?: LottieSize
  className?: string
  loop?: boolean
}) {
  const dimension = LOTTIE_SIZE_PX[size]

  return (
    <div
      className={cn('mx-auto flex shrink-0 items-center justify-center overflow-hidden', className)}
      style={{
        width: dimension,
        height: dimension,
        maxWidth: 'min(100%, 90vw)',
        maxHeight: 'min(100%, 90vw)',
      }}
      aria-hidden>
      <DotLottieReact
        src={LOTTIE_SOURCES[kind]}
        loop={loop}
        autoplay
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
