import { Resend } from 'resend'
import { render } from '@react-email/render'
import {
  AdminOrderAlertEmail,
  OrderConfirmationEmail,
  PaymentSuccessEmail,
  type PaymentSuccessEmailProps,
} from '@/lib/emails/templates'
import {
  formatOrderPlacedAt,
  formatPaymentMethod,
  formatShippingAddress,
  toOrderDisplayData,
} from '@/lib/orders/order-display'
import { getOrderById } from '@/lib/services/orders'
import { toAbsoluteImageUrl } from '@/lib/stripe/helpers'
import { normalizeProductImageUrls, primaryProductImageUrl } from '@/lib/utils/product-images'

function getEmailBaseUrl() {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

const from = process.env.EMAIL_FROM ?? 'CartPulse <onboarding@resend.dev>'

function buildPaymentSuccessProps(
  order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>,
  customerName?: string,
): PaymentSuccessEmailProps {
  const display = toOrderDisplayData(order)

  return {
    orderId: display.id,
    customerName,
    placedAt: formatOrderPlacedAt(display.createdAt),
    paymentMethod: formatPaymentMethod(display.paymentMethod),
    items: display.items.map((item) => {
      const primaryImage = primaryProductImageUrl(
        normalizeProductImageUrls(item.product.imageUrls, item.product.imageUrl),
      )
      return {
        name: item.product.name,
        variant: item.variant?.color ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        emoji: item.product.emoji,
        imageUrl: primaryImage
          ? toAbsoluteImageUrl(primaryImage, getEmailBaseUrl()) ?? primaryImage
          : null,
      }
    }),
    subtotal: display.subtotal,
    tax: display.tax,
    shipping: display.shipping,
    discount: display.discount,
    total: display.total,
    shippingAddress: formatShippingAddress(display),
  }
}

/** Send branded payment receipt after Stripe (or demo) checkout completes. */
export async function sendPaymentSuccessEmail(input: {
  orderId: string
  customerName?: string
  to?: string
}) {
  const order = await getOrderById(input.orderId)
  if (!order) {
    console.warn('[email] Payment success — order not found:', input.orderId)
    return { ok: false, reason: 'order_not_found' as const }
  }

  const to = input.to ?? order.user.email
  if (!to) {
    return { ok: false, reason: 'no_email' as const }
  }

  const props = buildPaymentSuccessProps(order, input.customerName ?? order.user.name ?? undefined)
  const resend = getResend()

  if (!resend) {
    console.info('[email stub] Payment success →', to, props.orderId, props.total)
    return { ok: true, stub: true }
  }

  const html = await render(PaymentSuccessEmail(props))

  await resend.emails.send({
    from,
    to,
    subject: `Payment successful — Order #${props.orderId.slice(0, 8).toUpperCase()} · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(props.total)}`,
    html,
  })

  return { ok: true }
}

/** Customer receipt + admin alert after a Stripe payment is fulfilled. */
export async function notifyStripePaymentSuccess(orderId: string) {
  const order = await getOrderById(orderId)
  if (!order) return { ok: false as const }

  if (order.user.email) {
    await sendPaymentSuccessEmail({
      orderId,
      to: order.user.email,
      customerName: order.user.name ?? undefined,
    })
  }

  await sendAdminOrderAlert({
    orderId: order.id,
    customerEmail: order.user.email ?? '',
    total: order.total,
  })

  return { ok: true as const }
}

export async function sendOrderConfirmationEmail(input: {
  to: string
  orderId: string
  total: number
  customerName?: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] Order confirmation →', input.to, input.orderId, input.total)
    return { ok: true, stub: true }
  }

  const html = await render(
    OrderConfirmationEmail({
      orderId: input.orderId,
      total: input.total,
      customerName: input.customerName,
    }),
  )

  await resend.emails.send({
    from,
    to: input.to,
    subject: `Order confirmed — ${input.orderId.slice(0, 8)}`,
    html,
  })

  return { ok: true }
}

export async function sendAdminOrderAlert(input: { orderId: string; customerEmail: string; total: number }) {
  const resend = getResend()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resend || !adminEmail) {
    console.info('[email stub] Admin alert →', input.orderId, input.customerEmail, input.total)
    return { ok: true, stub: true }
  }

  const html = await render(
    AdminOrderAlertEmail({
      orderId: input.orderId,
      customerEmail: input.customerEmail,
      total: input.total,
    }),
  )

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `New paid order — ${input.orderId.slice(0, 8)}`,
    html,
  })

  return { ok: true }
}
