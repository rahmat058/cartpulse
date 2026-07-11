import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { markOrderPaid } from '@/lib/services/orders'
import { notifyStripePaymentSuccess } from '@/lib/emails/send-order-email'
import { getStripeServer } from '@/lib/stripe/stripe-server'

export async function POST(request: Request) {
  const stripe = getStripeServer()
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 })
  }

  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Webhook signature error:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (orderId && session.payment_status === 'paid') {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      })
      if (existing?.status === 'PAID') {
        return NextResponse.json({ received: true })
      }

      await markOrderPaid(orderId, session.id)
      await notifyStripePaymentSuccess(orderId)
    }
  }

  return NextResponse.json({ received: true })
}
