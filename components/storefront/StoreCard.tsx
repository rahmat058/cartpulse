import Link from 'next/link'
import { BadgeCheck, ChevronRight, Package, ShoppingBag, Star } from 'lucide-react'
import { StoreLogoMark } from '@/components/shared/StoreLogoMark'
import { stripRichText } from '@/lib/utils/rich-text'
import type { StoreProfile } from '@/lib/services/stores'

export function StoreCard({ store }: { store: StoreProfile }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex flex-col rounded-md border border-slate-200 bg-white p-5 transition-colors hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-teal-900 dark:hover:bg-teal-950/30">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-teal-50 text-2xl dark:bg-teal-950/50">
          <StoreLogoMark
            name={store.name}
            logoUrl={store.logoUrl}
            logoEmoji={store.logoEmoji}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">{store.name}</h2>
            {store.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
                <BadgeCheck className="h-3 w-3" />
                Official
              </span>
            ) : null}
          </div>
          {store.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{stripRichText(store.description)}</p>
          ) : null}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
        {store.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {store.averageRating.toFixed(1)}
          </span>
        ) : (
          <span className="text-slate-400">No ratings yet</span>
        )}
        <span className="inline-flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          {store.productCount} product{store.productCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5" />
          {store.soldCount}+ sold
        </span>
        <span>Since {store.memberSince}</span>
      </div>
    </Link>
  )
}
