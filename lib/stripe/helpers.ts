import { STRIPE_CURRENCY } from '@/lib/stripe/constants'

/** Convert dollars to Stripe's smallest currency unit (cents for USD). */
export function formatAmountForStripe(amount: number, currency = STRIPE_CURRENCY): number {
  const zeroDecimal = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])
  if (zeroDecimal.has(currency.toLowerCase())) {
    return Math.round(amount)
  }
  return Math.round(amount * 100)
}

/** Resolve the public app origin for Stripe success/cancel redirect URLs. */
export function getAppOrigin(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (request) return new URL(request.url).origin
  return 'http://localhost:3000'
}

/** Stripe product images must be absolute HTTPS URLs. */
export function toAbsoluteImageUrl(imageUrl: string | null | undefined, origin: string): string | undefined {
  if (!imageUrl?.trim()) return undefined
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`
  return trimmed
}
