import Stripe from 'stripe'

let stripeClient: Stripe | null = null

/** Singleton Stripe server client — one instance per process. */
export function getStripeServer(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null

  if (!stripeClient) {
    stripeClient = new Stripe(key)
  }

  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}
