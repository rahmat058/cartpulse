'use client'

import { LottieIllustration } from '@/components/lottie/LottieIllustration'
import { cn } from '@/lib/utils/cn'

export function CheckoutPaymentErrorLottie({ className }: { className?: string }) {
  return <LottieIllustration kind="payment-error" size="lg" className={className} />
}
