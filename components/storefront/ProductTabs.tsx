'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { RichTextContent } from '@/components/shared/RichTextContent'
import { ProductReviewsTab } from '@/components/storefront/ProductReviewsTab'
import type { ProductReviewItem } from '@/lib/services/reviews'

/** Compound tabs — Description / Specs / Reviews */
export function ProductTabs({
  description,
  specs,
  productId,
  initialReviews,
}: {
  description: string
  specs: Array<{ label: string; value: string }>
  productId: string
  initialReviews: ProductReviewItem[]
}) {
  const tabs = [
    { id: 'description' as const, label: 'Description' },
    { id: 'specs' as const, label: 'Specifications' },
    { id: 'reviews' as const, label: 'Reviews' },
  ]
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('description')

  return (
    <section className="glass-card mt-8 overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-5 py-3 text-sm font-semibold transition-colors',
              active === tab.id
                ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className={cn(
          'text-sm leading-relaxed text-slate-600 dark:text-slate-300',
          active === 'specs' ? 'p-0' : 'p-6',
        )}
      >
        {active === 'description' && <RichTextContent html={description} />}
        {active === 'specs' && (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {specs.map((row, index) => (
              <div
                key={row.label}
                className={cn(
                  'grid grid-cols-2 items-center gap-6 px-6 py-4',
                  index % 2 === 0
                    ? 'bg-slate-50/90 dark:bg-slate-900/50'
                    : 'bg-white dark:bg-slate-950',
                )}
              >
                <dt className="font-medium text-slate-500 dark:text-slate-400">{row.label}</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {active === 'reviews' && (
          <ProductReviewsTab productId={productId} initialReviews={initialReviews} />
        )}
      </div>
    </section>
  )
}
