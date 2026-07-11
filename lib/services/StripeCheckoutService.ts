import type Stripe from 'stripe'
import { BaseService } from '@/lib/core/BaseService'
import { markOrderPaid } from '@/lib/services/orders'
import { STRIPE_CURRENCY } from '@/lib/stripe/constants'
import {
  formatAmountForStripe,
  getAppOrigin,
  toAbsoluteImageUrl,
} from '@/lib/stripe/helpers'
import { getStripeServer, isStripeConfigured } from '@/lib/stripe/stripe-server'

type OrderWithItems = Awaited<ReturnType<typeof import('@/lib/services/orders').createOrderFromCart>>

export interface StripeCheckoutSessionResult {
  url: string
  sessionId: string
  orderId: string
}

/**
 * Service layer — Stripe Checkout Session creation and post-redirect verification.
 * Implements hosted Checkout (redirect) per Vercel + Stripe Next.js guide.
 */
export class StripeCheckoutService extends BaseService {
  isConfigured(): boolean {
    return isStripeConfigured()
  }

  /** Build line items matching the order total (products + tax + shipping − discount). */
  buildLineItems(order: OrderWithItems, origin: string): Stripe.Checkout.SessionCreateParams.LineItem[] {
    const items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => {
      const image = toAbsoluteImageUrl(item.product.imageUrl, origin)
      return {
        quantity: item.quantity,
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: formatAmountForStripe(item.unitPrice),
          product_data: {
            name: item.product.name,
            description: item.variant?.color ?? undefined,
            ...(image ? { images: [image] } : {}),
          },
        },
      }
    })

    if (order.tax > 0) {
      items.push({
        quantity: 1,
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: formatAmountForStripe(order.tax),
          product_data: { name: 'Sales tax' },
        },
      })
    }

    if (order.shipping > 0) {
      items.push({
        quantity: 1,
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: formatAmountForStripe(order.shipping),
          product_data: { name: 'Shipping' },
        },
      })
    }

    return items
  }

  async createCheckoutSession(
    order: OrderWithItems,
    options: { customerEmail?: string | null; origin: string },
  ): Promise<StripeCheckoutSessionResult> {
    const stripe = getStripeServer()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }

    const lineItems = this.buildLineItems(order, options.origin)

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_email: options.customerEmail ?? undefined,
      line_items: lineItems,
      success_url: `${options.origin}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${options.origin}/checkout/cancel?orderId=${order.id}`,
      metadata: {
        orderId: order.id,
        userId: order.userId,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          userId: order.userId,
        },
      },
    }

    if (order.discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: formatAmountForStripe(order.discount),
        currency: STRIPE_CURRENCY,
        duration: 'once',
        name: 'Order discount',
      })
      sessionParams.discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    return {
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    }
  }

  /**
   * Verify payment after redirect — marks order PAID when webhook has not fired yet (local dev).
   */
  async verifySessionAndFulfill(sessionId: string): Promise<{
    orderId: string | null
    paid: boolean
    alreadyPaid: boolean
  }> {
    const stripe = getStripeServer()
    if (!stripe) {
      return { orderId: null, paid: false, alreadyPaid: false }
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const orderId = session.metadata?.orderId ?? null
    const paid = session.payment_status === 'paid'

    if (!orderId || !paid) {
      return { orderId, paid: false, alreadyPaid: false }
    }

    const existing = await this.db.order.findUnique({
      where: { id: orderId },
      select: { status: true, stripeSessionId: true },
    })

    if (!existing) {
      return { orderId, paid: false, alreadyPaid: false }
    }

    if (existing.status === 'PAID' || existing.stripeSessionId) {
      return { orderId, paid: true, alreadyPaid: true }
    }

    await markOrderPaid(orderId, sessionId)
    return { orderId, paid: true, alreadyPaid: false }
  }
}

export const stripeCheckoutService = new StripeCheckoutService()
