'use client'

import { useTranslations } from 'next-intl'
import { BadgeCheck, CreditCard, RotateCcw, ShieldCheck, Truck } from 'lucide-react'

const TRUST_ITEM_KEYS = [
  { key: 'fastDelivery', icon: Truck },
  { key: 'returns', icon: RotateCcw },
  { key: 'secureCheckout', icon: CreditCard },
  { key: 'buyerProtection', icon: ShieldCheck },
  { key: 'authentic', icon: BadgeCheck },
] as const

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('trust')
  const items = TRUST_ITEM_KEYS.slice(0, compact ? 3 : TRUST_ITEM_KEYS.length)

  return (
    <section className={compact ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-5'}>
      {items.map(({ key, icon: Icon }) => (
        <div
          key={key}
          className="flex items-start gap-3 rounded-md border border-teal-100/80 bg-white/80 p-4 dark:border-teal-900/40 dark:bg-slate-900/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t(`${key}.title`)}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(`${key}.description`)}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
