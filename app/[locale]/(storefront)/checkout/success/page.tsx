import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper'
import { CheckoutSuccessClient } from '@/components/checkout/CheckoutSuccessClient'
import { CheckoutSuccessLottie } from '@/components/checkout/CheckoutSuccessLottie'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { notifyStripePaymentSuccess } from '@/lib/emails/send-order-email'
import { getOrderById } from '@/lib/services/orders'
import { stripeCheckoutService } from '@/lib/services/StripeCheckoutService'
import { formatCurrency } from '@/lib/utils/cartPricing'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string
    session_id?: string
    demo?: string
    method?: string
  }>
}) {
  const params = await searchParams
  const isCod = params.method === 'cod'
  const isDemo = params.demo === '1'

  let paymentVerified = isCod || isDemo
  let orderTotal: number | null = null

  if (params.session_id) {
    const result = await stripeCheckoutService.verifySessionAndFulfill(params.session_id)
    paymentVerified = result.paid

    if (result.paid && result.orderId && !result.alreadyPaid) {
      await notifyStripePaymentSuccess(result.orderId)
      const order = await getOrderById(result.orderId)
      orderTotal = order?.total ?? null
    } else if (result.orderId) {
      const order = await getOrderById(result.orderId)
      orderTotal = order?.total ?? null
    }
  } else if (params.orderId) {
    const order = await getOrderById(params.orderId)
    orderTotal = order?.total ?? null
    if (order?.status === 'PAID') paymentVerified = true
  }

  const shouldClearCart = paymentVerified && !isCod

  return (
    <StorefrontContainer as="main" className="py-10">
      <CheckoutSuccessClient shouldClearCart={shouldClearCart} />
      <CheckoutStepper current={3} />

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {paymentVerified ? <CheckoutSuccessLottie /> : null}

        <div className="relative z-10">
          <div
            className={cn(
              'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
              paymentVerified ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50' : 'bg-rose-50 text-rose-600',
            )}>
            {paymentVerified ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isCod ? 'Order placed' : paymentVerified ? 'Payment successful' : 'Order received'}
          </h1>
          <p className="mt-2 text-slate-500">
            {isCod
              ? 'Pay cash when your order arrives. Track it anytime from My Account.'
              : isDemo
                ? 'Demo payment completed.'
                : paymentVerified
                  ? 'Thank you for your purchase. A payment confirmation email is on its way.'
                  : 'We are confirming your payment. Check My Account for order status.'}
          </p>
          {orderTotal !== null ? (
            <p className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Total paid: {formatCurrency(orderTotal)}
            </p>
          ) : null}
          {params.orderId ? (
            <div className="mt-5 inline-flex max-w-full flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Order ID</span>
              <span className="inline-flex max-w-full items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-mono text-sm font-bold tracking-wide break-all text-teal-800 shadow-sm dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                {params.orderId}
              </span>
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/orders">
              <Button variant="outline">View orders</Button>
            </Link>
            <Link href="/products">
              <Button>Continue shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </StorefrontContainer>
  )
}
