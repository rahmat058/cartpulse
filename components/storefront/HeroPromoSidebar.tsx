'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { Banknote, ChevronRight, Truck } from 'lucide-react'

type HeroPromoCardProps = {
  title: string
  description: string
  href: '/products' | '/products?sort=newest'
  baseGradient: string
  radialGradient: string
  hoverShadow: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconBgClassName: string
  iconGlowClassName: string
  subtitleClassName: string
  className?: string
}

function HeroPromoCard({
  title,
  description,
  href,
  baseGradient,
  radialGradient,
  hoverShadow,
  icon: Icon,
  iconBgClassName,
  iconGlowClassName,
  subtitleClassName,
  className,
}: HeroPromoCardProps) {
  const tCommon = useTranslations('common')

  return (
    <Link
      href={href}
      aria-label={`${title} — ${description}`}
      className={cn(
        'group relative flex min-h-[168px] overflow-hidden rounded-2xl border border-white/70',
        'shadow-lg shadow-black/5 dark:border-slate-700/60 dark:shadow-black/20',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-2 hover:border-white hover:shadow-2xl dark:hover:border-slate-600/80',
        hoverShadow,
        'focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-950',
        className,
      )}>
      <div aria-hidden className={cn('absolute inset-0', baseGradient)} />
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100',
          radialGradient,
        )}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-5 p-5 pr-22 sm:p-6 sm:pr-24">
        <div>
          <h3 className="text-lg leading-snug font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
            {title}
          </h3>
          <p className={cn('mt-1.5 text-sm leading-relaxed sm:text-[0.9375rem]', subtitleClassName)}>{description}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:shadow-md sm:px-4 sm:text-sm dark:bg-slate-900/90 dark:text-slate-100 dark:ring-white/10">
          {tCommon('shopNow')}
          <ChevronRight className="size-3.5 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 sm:size-4" />
        </span>
      </div>

      <div className="pointer-events-none absolute top-1/2 right-4 z-10 -translate-y-1/2 sm:right-5">
        <div
          aria-hidden
          className={cn(
            'absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-2xl transition-all duration-500 group-hover:size-28 group-hover:opacity-100',
            iconGlowClassName,
          )}
        />
        <div
          className={cn(
            'relative flex size-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-105 sm:size-14',
            iconBgClassName,
          )}>
          <Icon className="size-6 text-white sm:size-7" strokeWidth={2} />
        </div>
      </div>
    </Link>
  )
}

export function HeroPromoSidebar({ className }: { className?: string }) {
  const t = useTranslations('hero.promo')

  const promoCards = [
    {
      title: t('cashOnDelivery.title'),
      description: t('cashOnDelivery.description'),
      href: '/products' as const,
      baseGradient:
        'bg-linear-to-br from-rose-100 via-pink-50 to-orange-50/80 dark:from-rose-950/45 dark:via-slate-900 dark:to-slate-950',
      radialGradient:
        'bg-[radial-gradient(ellipse_at_88%_50%,rgba(244,63,94,0.32),rgba(251,207,232,0.15)_45%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_88%_50%,rgba(244,63,94,0.22),rgba(15,23,42,0.4)_45%,transparent_72%)]',
      hoverShadow: 'hover:shadow-rose-400/30',
      icon: Banknote,
      iconBgClassName: 'bg-linear-to-br from-rose-500 to-red-500 shadow-rose-500/40',
      iconGlowClassName: 'bg-rose-400/60',
      subtitleClassName: 'text-rose-400/90 dark:text-rose-300/80',
    },
    {
      title: t('nationwideDelivery.title'),
      description: t('nationwideDelivery.description'),
      href: '/products?sort=newest' as const,
      baseGradient:
        'bg-linear-to-br from-sky-100 via-blue-50 to-indigo-50/70 dark:from-sky-950/45 dark:via-slate-900 dark:to-slate-950',
      radialGradient:
        'bg-[radial-gradient(ellipse_at_88%_50%,rgba(59,130,246,0.35),rgba(191,219,254,0.2)_45%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_88%_50%,rgba(59,130,246,0.22),rgba(15,23,42,0.4)_45%,transparent_72%)]',
      hoverShadow: 'hover:shadow-sky-400/30',
      icon: Truck,
      iconBgClassName: 'bg-linear-to-br from-sky-500 to-blue-600 shadow-sky-500/40',
      iconGlowClassName: 'bg-sky-400/60',
      subtitleClassName: 'text-sky-500/80 dark:text-sky-300/80',
    },
  ]

  return (
    <aside
      aria-label={t('benefitsLabel')}
      className={cn('grid gap-3 sm:grid-cols-2 lg:flex lg:min-h-[440px] lg:flex-col lg:gap-4', className)}>
      {promoCards.map((card) => (
        <HeroPromoCard key={card.title} className="lg:flex-1" {...card} />
      ))}
    </aside>
  )
}
