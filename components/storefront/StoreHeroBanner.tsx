import type { StoreProfile } from '@/lib/services/stores'
import { StoreLogoMark } from '@/components/shared/StoreLogoMark'
import { stripRichText } from '@/lib/utils/rich-text'
import { BadgeCheck, Package, ShoppingBag, Star } from 'lucide-react'

interface StoreHeroBannerProps {
  store: StoreProfile
}

export function StoreHeroBanner({ store }: StoreHeroBannerProps) {
  const plainDescription = store.description ? stripRichText(store.description) : ''
  const subtitle =
    plainDescription ||
    (store.verified ? `${store.name} · Verified store on CartPulse` : `${store.name} on CartPulse`)

  return (
    <section className="relative overflow-hidden rounded-md bg-linear-to-br from-emerald-900 via-emerald-950 to-slate-950 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-3xl font-bold text-emerald-900 shadow-md">
          <StoreLogoMark
            name={store.name}
            logoUrl={store.logoUrl}
            logoEmoji={store.logoEmoji}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{store.name}</h1>
            {store.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
                Official
              </span>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-emerald-100/90">{subtitle}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90">
            {store.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {store.averageRating.toFixed(1)} rating
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-white/70">No ratings yet</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              {store.productCount} product{store.productCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              {store.soldCount}+ sold
            </span>
            {store.reviewCount > 0 ? (
              <span>
                {store.reviewCount} review{store.reviewCount === 1 ? '' : 's'}
              </span>
            ) : null}
            <span>Since {store.memberSince}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
