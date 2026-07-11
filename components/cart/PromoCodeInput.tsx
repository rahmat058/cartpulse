'use client'

import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { applyPromoCode, clearPromoCode } from '@/lib/store/slices/cartSlice'
import { selectCartPricing, selectPromoCode } from '@/lib/store/selectors/cartSelectors'
import { Button } from '@/components/ui/Button'
import type { CouponDefinition } from '@/types/commerce'
import { cn } from '@/lib/utils/cn'

export function PromoCodeInput() {
  const dispatch = useAppDispatch()
  const promoCode = useAppSelector(selectPromoCode)
  const pricing = useAppSelector(selectCartPricing)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  async function handleApply(event: React.FormEvent) {
    event.preventDefault()
    const code = input.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: pricing.subtotal }),
      })
      const body = (await response.json()) as {
        data?: CouponDefinition
        error?: string
      }

      if (!response.ok || !body.data) {
        setError(body.error ?? 'Invalid coupon')
        return
      }

      dispatch(applyPromoCode({ code: body.data.code, coupon: body.data }))
      setLabel(body.data.label)
      setInput('')
      toast.success(`Coupon ${body.data.code} applied`)
    } catch {
      setError('Could not validate coupon')
    } finally {
      setLoading(false)
    }
  }

  if (promoCode) {
    return (
      <div className="flex items-center justify-between rounded-md bg-teal-50 px-3 py-2 dark:bg-teal-950/40">
        <span className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-200">
          <Tag className="h-3.5 w-3.5" />
          {promoCode}
          {label || pricing.discountLabel ? ` — ${label ?? pricing.discountLabel}` : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            dispatch(clearPromoCode())
            setLabel(null)
          }}
          className="rounded p-1 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900"
          aria-label="Remove promo code">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setError(null)
          }}
          placeholder="Promo code (e.g. SAVE10)"
          className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-teal-600 dark:focus:ring-teal-900/50"
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          loading={loading}
          className={cn(
            'h-[38px] shrink-0 border-transparent px-4 text-sm font-semibold text-white',
            'bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500',
            'shadow-md shadow-teal-500/25 transition-all duration-300',
            'hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600 hover:shadow-lg hover:shadow-teal-500/35',
            'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
            'dark:shadow-teal-500/15 dark:hover:shadow-teal-500/25',
          )}
        >
          {loading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <p className="text-[10px] text-slate-400">Try SAVE10, FREESHIP, or CARTPULSE15</p>
    </form>
  )
}
