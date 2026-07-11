'use client'

import { useAppSelector } from '@/lib/store/hooks'
import { selectCartLines, selectCartPricing } from '@/lib/store/selectors/cartSelectors'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { PromoCodeInput } from '@/components/cart/PromoCodeInput'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'

export function OrderSummaryCard({
  ctaLabel,
  onCheckout,
  loading,
  showPromo = true,
  footerNote,
  disabled,
  paymentLabel,
}: {
  ctaLabel: string
  onCheckout: () => void
  loading?: boolean
  showPromo?: boolean
  footerNote?: string
  disabled?: boolean
  paymentLabel?: string
}) {
  const lines = useAppSelector(selectCartLines)
  const pricing = useAppSelector(selectCartPricing)

  const catalogSavings = lines.reduce((sum, line) => {
    const promo = ProductPricing.for(line.product)
    return sum + Math.max(0, promo.originalPrice - promo.salePrice) * line.quantity
  }, 0)
  const itemSavings = catalogSavings
  const totalDue = pricing.total

  if (pricing.itemCount === 0) return null

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Order Summary</h2>

      {showPromo && (
        <div className="mt-4">
          <PromoCodeInput />
        </div>
      )}

      <div className="mt-5 space-y-2.5 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Subtotal</span>
          <span className="tabular-nums font-medium">{formatCurrency(pricing.subtotal)}</span>
        </div>
        {itemSavings > 0 && (
          <div className="flex justify-between text-teal-600">
            <span>Item savings</span>
            <span className="tabular-nums">−{formatCurrency(itemSavings)}</span>
          </div>
        )}
        {pricing.discount > 0 && (
          <div className="flex justify-between text-teal-600">
            <span>{pricing.discountLabel ?? 'Promo discount'}</span>
            <span className="tabular-nums">−{formatCurrency(pricing.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Delivery</span>
          <span className="tabular-nums">
            {pricing.shipping === 0 ? 'Free' : formatCurrency(pricing.shipping)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Tax</span>
          <span className="tabular-nums">{formatCurrency(pricing.tax)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
          <span>{paymentLabel ?? 'Total'}</span>
          <span className="tabular-nums text-teal-700 dark:text-teal-300">
            {formatCurrency(totalDue)}
          </span>
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        size="lg"
        loading={loading}
        disabled={disabled}
        onClick={onCheckout}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="mt-3 space-y-1.5 text-center text-[11px] text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Cash on Delivery · Fast delivery
        </p>
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          7-day returns
        </p>
        {footerNote ? <p>{footerNote}</p> : null}
      </div>
    </aside>
  )
}
