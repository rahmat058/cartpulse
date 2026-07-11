import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Singleton pattern — load Stripe.js once in the browser (Vercel / Stripe docs).
 * Used when embedding Stripe Elements; hosted Checkout redirects via session URL.
 */
export function getStripeJs(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) return null

  if (!stripePromise) {
    stripePromise = loadStripe(key)
  }

  return stripePromise
}
