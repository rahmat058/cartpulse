'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { StoreLogoMark } from '@/components/shared/StoreLogoMark'
import { ShelfSeeAllLink } from '@/components/storefront/ShelfSeeAllLink'
import { useShelfItemLimit } from '@/hooks/use-shelf-item-limit'

type StoreItem = {
  slug: string
  name: string
  logoEmoji?: string
  logoUrl?: string
  verified?: boolean
}

export function FeaturedStoresGrid({ stores, seeAllHref }: { stores: StoreItem[]; seeAllHref?: string }) {
  const t = useTranslations('common')
  const limit = useShelfItemLimit()
  const visible = stores.slice(0, limit)
  const hasMore = stores.length > visible.length

  if (visible.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((store) => (
          <Link
            key={store.slug}
            href={`/stores/${store.slug}` as '/stores'}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/80 text-base dark:bg-slate-800">
              <StoreLogoMark name={store.name} logoUrl={store.logoUrl} logoEmoji={store.logoEmoji ?? '🛍️'} />
            </span>
            <span className="min-w-0 truncate">{store.name}</span>
            {store.verified ? (
              <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                {t('verified')}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
      {hasMore && seeAllHref ? <ShelfSeeAllLink href={seeAllHref} label={t('seeAllStores')} /> : null}
    </>
  )
}
