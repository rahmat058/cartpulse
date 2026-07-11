'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { LOTTIE_SOURCES } from '@/components/lottie/lottie-sources'
import { cn } from '@/lib/utils/cn'

/** Full-card confetti overlay — card must be `relative overflow-hidden`. */
export function CheckoutSuccessLottie({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden>
      <DotLottieReact
        src={LOTTIE_SOURCES.success}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
