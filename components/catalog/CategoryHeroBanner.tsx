import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Banknote, Package, Truck } from 'lucide-react'
import type { CategoryPageContext } from '@/lib/catalog/category-context'

interface CategoryHeroBannerProps {
  context: CategoryPageContext
  productTotal: number
}

export function CategoryHeroBanner({ context, productTotal }: CategoryHeroBannerProps) {
  const { current, parent, parentHref } = context
  const backLabel = parent?.name ?? 'Categories'

  return (
    <section className="relative overflow-hidden rounded-md bg-linear-to-br from-slate-900 via-slate-900 to-teal-950 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />

      <Link
        href={parentHref}
        className="relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white/90 uppercase transition-colors hover:bg-white/15">
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <h1 className="relative mt-4 text-3xl font-bold text-white sm:text-4xl">{current.name}</h1>
      <p className="relative mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
        Browse {current.name} on CartPulse — authentic products with fast delivery.
      </p>

      <div className="relative mt-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">
          <Package className="h-3.5 w-3.5" />
          {productTotal} product{productTotal === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90">
          <Banknote className="h-3.5 w-3.5" />
          100% Cash on Delivery
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90">
          <Truck className="h-3.5 w-3.5" />
          Nationwide delivery
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified sellers
        </span>
      </div>
    </section>
  )
}
