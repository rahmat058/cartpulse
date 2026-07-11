'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const FAQ_ITEMS = [
  {
    q: 'How does CartPulse checkout work?',
    a: 'Add items to your cart, apply a promo code if you have one, and proceed to Stripe Checkout. Your order is saved to your dashboard after payment.',
  },
  {
    q: 'Is shipping free?',
    a: 'Orders over $75 qualify for free shipping. Store-specific thresholds may apply and are shown in admin settings.',
  },
  {
    q: 'Can I return a product?',
    a: 'Demo marketplace supports a 7-day return window on eligible items. Contact the store support email listed in admin settings.',
  },
  {
    q: 'Do filters sync to the URL?',
    a: 'Yes — category, price, rating, sort, and search all sync to searchParams so you can bookmark or share filtered catalog views.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Frequently asked questions</h2>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index
          return (
            <li key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.q}</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
              </button>
              {open && <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
