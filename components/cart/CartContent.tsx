'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { clearCart } from '@/lib/store/slices/cartSlice'
import { selectCartLines, selectCartPricing } from '@/lib/store/selectors/cartSelectors'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { Button } from '@/components/ui/Button'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartEmpty } from '@/components/cart/CartEmpty'
import { CartSummary } from '@/components/cart/CartSummary'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'
import { ShippingProgress } from '@/components/cart/ShippingProgress'

interface CartContentProps {
  variant?: 'panel' | 'drawer'
  onClose?: () => void
}

export function CartContent({ variant = 'panel', onClose }: CartContentProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { data: session, status } = useSession()
  const lines = useAppSelector(selectCartLines)
  const pricing = useAppSelector(selectCartPricing)
  const [checkingOut, setCheckingOut] = useState(false)
  const isDrawer = variant === 'drawer'
  const isEmpty = lines.length === 0

  const catalogSavings = lines.reduce((sum, line) => {
    const promo = ProductPricing.for(line.product)
    return sum + Math.max(0, promo.originalPrice - promo.salePrice) * line.quantity
  }, 0)
  const totalSavings = catalogSavings + pricing.discount

  function handleCheckout() {
    setCheckingOut(true)
    onClose?.()

    if (status === 'unauthenticated' || !session?.user) {
      toast.message('Sign in to checkout')
      router.push('/login?callbackUrl=/checkout')
      return
    }

    router.push('/checkout')
  }

  return (
    <div className={isDrawer ? 'flex min-h-0 flex-1 flex-col' : undefined}>
      {!isDrawer && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your cart</h2>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => dispatch(clearCart())}
              className="text-xs font-medium text-slate-400 hover:text-rose-500">
              Clear all
            </button>
          )}
        </div>
      )}

      {isDrawer && !isEmpty && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2.5 text-xs font-medium text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
          <Truck className="h-4 w-4 shrink-0" />
          Fast delivery nationwide — secure Stripe checkout when you arrive.
        </div>
      )}

      <div className={isDrawer ? 'flex flex-1 flex-col overflow-hidden' : ''}>
        {isEmpty ? (
          <CartEmpty variant={isDrawer ? 'drawer' : 'panel'} onClose={onClose} />
        ) : (
          <ul className={isDrawer ? 'flex-1 overflow-y-auto px-5 py-2' : 'flex-1 overflow-y-auto pr-1'}>
            {lines.map((line) => (
              <CartLineItem
                key={line.lineKey}
                lineKey={line.lineKey}
                productId={line.productId}
                variantId={line.variantId}
                quantity={line.quantity}
                product={line.product}
                variant={line.variant}
                drawer={isDrawer}
              />
            ))}
          </ul>
        )}
      </div>

      <div
        className={
          isDrawer ? 'border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950' : 'mt-4 space-y-3'
        }>
        {isDrawer ? (
          <>
            <PromoCodeInput />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(pricing.subtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-teal-600">
                  <span>You save</span>
                  <span className="tabular-nums">−{formatCurrency(totalSavings)}</span>
                </div>
              )}
              {!isEmpty && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Delivery</span>
                  <span className="tabular-nums">
                    {pricing.shipping === 0 ? 'Free' : formatCurrency(pricing.shipping)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                <span>Total</span>
                <span className="text-teal-700 tabular-nums dark:text-teal-300">{formatCurrency(pricing.total)}</span>
              </div>
            </div>
            {!isEmpty && (
              <>
                <Button className="mt-4 w-full" size="lg" loading={checkingOut} onClick={handleCheckout}>
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Cash on Delivery · 7-day returns
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <ShippingProgress />
            <PromoCodeInput />
            <CartSummary />
            <Button className="w-full" size="lg" loading={checkingOut} onClick={handleCheckout}>
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
