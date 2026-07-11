'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { Product } from '@/types/cart'
import { FlashSaleTimer } from '@/lib/commerce/FlashSaleTimer'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { cn } from '@/lib/utils/cn'

export function FlashSaleSection({ products }: { products: Product[] }) {
  const [timer] = useState(() => FlashSaleTimer.untilHoursFromNow(6))
  const [countdown, setCountdown] = useState(timer.getRemaining())

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(timer.getRemaining()), 1000)
    return () => window.clearInterval(id)
  }, [timer])

  if (products.length === 0) return null

  return (
    <section className="overflow-hidden rounded-md border border-teal-200/80 bg-white/80 dark:border-teal-900/40 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-teal-700 to-cyan-700 px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 fill-current" />
          <h2 className="text-lg font-bold">Flash Sale</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-teal-100">Ending in</span>
          <div className="flex gap-1 font-mono text-sm font-bold">
            {[
              { label: 'H', value: countdown.hours },
              { label: 'M', value: countdown.minutes },
              { label: 'S', value: countdown.seconds },
            ].map((part) => (
              <span
                key={part.label}
                className="rounded bg-white/15 px-2 py-1 tabular-nums"
                aria-label={`${part.value} ${part.label}`}
              >
                {String(part.value).padStart(2, '0')}
              </span>
            ))}
          </div>
          <Link href="/products?sort=price-desc" className="ml-2 text-xs underline">
            View all
          </Link>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => {
          const pricing = ProductPricing.for(product)
          const stockPct = Math.min(100, Math.max(8, 100 - product.stock * 3))

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-md border border-slate-100 bg-white p-3 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-teal-50 to-cyan-50 text-4xl">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  product.emoji
                )}
                <span className="absolute top-2 left-2 rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{pricing.discountPercent}%
                </span>
              </div>
              <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-teal-700 dark:text-slate-100">
                {product.name}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-bold text-teal-700">{formatCurrency(pricing.salePrice)}</span>
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(pricing.originalPrice)}
                </span>
              </div>
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full bg-linear-to-r from-teal-500 to-cyan-500')}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{product.stock} left in stock</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
