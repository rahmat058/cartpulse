import Link from 'next/link'
import { AlertCircle, ArrowRight, RefreshCw, ShoppingCart, XCircle } from 'lucide-react'
import { CheckoutPaymentErrorLottie } from '@/components/checkout/CheckoutPaymentErrorLottie'
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { Button } from '@/components/ui/Button'
import { getOrderById } from '@/lib/services/orders'
import { formatCurrency } from '@/lib/utils/cartPricing'

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const params = await searchParams
  const order = params.orderId ? await getOrderById(params.orderId) : null

  return (
    <StorefrontContainer as="main" className="py-10">
      <CheckoutStepper current={2} />

      <div className="mx-auto max-w-3xl rounded-md border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <XCircle className="h-9 w-9" />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          Payment not completed
        </h1>
        <p className="mx-auto mt-2 max-w-md text-slate-500">
          You left checkout before the payment went through.{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">No charge was made.</span>{' '}
          Your cart is unchanged and ready when you are.
        </p>

        {order ? (
          <div className="mx-auto mt-5 max-w-sm rounded-md border border-rose-100 bg-rose-50/60 px-4 py-3 text-left dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-300">
              <AlertCircle className="size-5 shrink-0" />
              Order not paid
            </p>
            <p className="mt-1 text-sm text-rose-700/90 dark:text-rose-200/80">
              Reference amount:{' '}
              <span className="font-semibold">{formatCurrency(order.total)}</span>
              {' · '}
              Status: <span className="font-medium capitalize">{order.status.toLowerCase()}</span>
            </p>
          </div>
        ) : null}

        {params.orderId ? (
          <div className="mt-5 inline-flex max-w-full flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Order reference
            </span>
            <span className="inline-flex max-w-full items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-mono text-sm font-bold tracking-wide break-all text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
              {params.orderId}
            </span>
          </div>
        ) : null}

        <CheckoutPaymentErrorLottie className="mt-6" />

        <ul className="mx-auto mt-6 max-w-md space-y-2.5 rounded-md border border-slate-100 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          <li className="flex items-start gap-2.5">
            <ShoppingCart className="mt-0.5 size-5 shrink-0 text-teal-600" />
            Items in your cart are still saved — nothing was removed.
          </li>
          <li className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-teal-600" />
            Card declined or blocked? Try another card or see Stripe test cards in the README.
          </li>
        </ul>

        <div className="mx-auto mt-8 w-full max-w-md border-t border-slate-200 pt-8 dark:border-slate-800">
          <Link href="/checkout" className="block w-full">
            <Button size="xl" className="w-full gap-2 shadow-sm">
              <RefreshCw className="size-5" />
              Try payment again
            </Button>
          </Link>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Link href="/cart" className="block w-full">
              <Button variant="outline" size="lg" className="w-full gap-2">
                <ShoppingCart className="size-5" />
                View cart
              </Button>
            </Link>
            <Link href="/products" className="block w-full">
              <Button variant="secondary" size="lg" className="w-full gap-2">
                Continue shopping
                <ArrowRight className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </StorefrontContainer>
  )
}
