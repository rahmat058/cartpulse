import { NextResponse } from 'next/server'
import { parseJsonBody } from '@/lib/api'
import { requireSessionUser } from '@/lib/auth'
import { checkoutBodySchema } from '@/lib/validations/cart'
import {
  notifyStripePaymentSuccess,
  sendAdminOrderAlert,
  sendOrderConfirmationEmail,
} from '@/lib/emails/send-order-email'
import { createOrderFromCart, markOrderPaid } from '@/lib/services/orders'
import { recordCouponUsage } from '@/lib/services/coupons'
import { stripeCheckoutService } from '@/lib/services/StripeCheckoutService'
import { getAppOrigin } from '@/lib/stripe/helpers'
import { isStripeConfigured } from '@/lib/stripe/stripe-server'
import type { CartItemsById } from '@/types/cart'

export async function POST(request: Request) {
  const user = await requireSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Your session expired after a database reset. Please sign in again.' },
      { status: 401 },
    )
  }

  try {
    const parsed = await parseJsonBody(request)

    if ('error' in parsed) return parsed.error

    const validated = checkoutBodySchema.safeParse(parsed.data)
    if (!validated.success) {
      const message = validated.error.issues[0]?.message ?? 'Invalid checkout request'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const body = validated.data
    const paymentMethod = body.paymentMethod ?? 'STRIPE'
    const address = body.shippingAddress

    const order = await createOrderFromCart(user.id, body.itemsById as CartItemsById, body.promoCode ?? null, {
      paymentMethod,
      deliveryNote: body.deliveryNote,
      shippingAddress: {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        line1: address.line1.trim(),
        line2: address.line2?.trim() || null,
        city: address.city.trim(),
        country: address.country.trim(),
      },
    })

    const origin = getAppOrigin(request)

    if (paymentMethod === 'COD') {
      await recordCouponUsage(order.promoCode, order.discount)
      if (user.email) {
        await sendOrderConfirmationEmail({
          to: user.email,
          orderId: order.id,
          total: order.total,
          customerName: user.name ?? undefined,
        })
      }
      await sendAdminOrderAlert({
        orderId: order.id,
        customerEmail: user.email ?? '',
        total: order.total,
      })
      return NextResponse.json({
        demo: false,
        orderId: order.id,
        paymentMethod: 'COD',
        url: `${origin}/checkout/success?orderId=${order.id}&method=cod`,
      })
    }

    if (!isStripeConfigured()) {
      await markOrderPaid(order.id, `demo_${order.id}`)
      await notifyStripePaymentSuccess(order.id)
      return NextResponse.json({
        demo: true,
        orderId: order.id,
        url: `${origin}/checkout/success?orderId=${order.id}&demo=1`,
      })
    }

    const session = await stripeCheckoutService.createCheckoutSession(order, {
      customerEmail: user.email,
      origin,
    })

    return NextResponse.json({
      url: session.url,
      orderId: session.orderId,
      sessionId: session.sessionId,
      paymentMethod: 'STRIPE',
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout failed' }, { status: 400 })
  }
}
