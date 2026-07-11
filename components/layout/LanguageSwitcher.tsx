'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'EN',
  bn: 'বাং',
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 dark:border-teal-900/50 dark:bg-slate-900/80',
        pending && 'opacity-70',
        className,
      )}
      role="group"
      aria-label="Language">
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          className={cn(
            'rounded px-2 py-1.5 text-[11px] font-semibold transition-colors',
            locale === code
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
          )}
          aria-pressed={locale === code}>
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  )
}
