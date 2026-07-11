export type LottieKind = '404' | 'no-result' | 'success' | 'payment-error'

export type LottieSize = 'sm' | 'md' | 'lg' | 'xl'

export const LOTTIE_SOURCES: Record<LottieKind, string> = {
  '404': '/images/lottie-animation/404.lottie',
  'no-result': '/images/lottie-animation/no-result-found.lottie',
  success: '/images/lottie-animation/success-animation.lottie',
  'payment-error': '/images/lottie-animation/payment-error.lottie',
}

export const LOTTIE_SIZE_PX: Record<LottieSize, number> = {
  sm: 168,
  md: 256,
  lg: 320,
  xl: 400,
}
