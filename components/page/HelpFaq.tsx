'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

const FAQ_KEYS = ['checkout', 'shipping', 'returns', 'filters'] as const

export function HelpFaq() {
  const t = useTranslations('pages.help.faq')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="glass-card p-6 sm:p-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('title')}</h2>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {FAQ_KEYS.map((key, index) => {
          const open = openIndex === index
          return (
            <li key={key}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t(`${key}.q`)}</span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
                />
              </button>
              {open ? <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(`${key}.a`)}</p> : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
