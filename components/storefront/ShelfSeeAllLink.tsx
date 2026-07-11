'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'

export function ShelfSeeAllLink({ href, label }: { href: string; label?: string }) {
  const t = useTranslations('common')
  const text = label ?? t('seeAll')

  return (
    <div className="mt-5 flex justify-center border-t border-slate-200/80 pt-4 dark:border-slate-800">
      <Link
        href={href as '/products'}
        className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300">
        {text}
        <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}
