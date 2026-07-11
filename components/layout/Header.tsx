'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { cn, firstNameFrom } from '@/lib/utils/cn'
import { storefrontContainerClass } from '@/components/layout/StorefrontContainer'
import { Heart, ShoppingCart, User } from 'lucide-react'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCategories } from '@/hooks/use-categories'
import { useAppSelector } from '@/lib/store/hooks'
import { selectCartItemCount } from '@/lib/store/selectors/cartSelectors'
import { Link, usePathname } from '@/i18n/navigation'
import { withLocalePath } from '@/i18n/locale-path'
import type { AppLocale } from '@/i18n/routing'

function HeaderSearchFallback() {
  return <div className="h-11 max-w-xl min-w-0 flex-1 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
}

export function Header() {
  const pathname = usePathname()
  const locale = useLocale() as AppLocale
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const itemCount = useAppSelector(selectCartItemCount)
  const { count: wishlistCount } = useWishlist()
  const { openCart } = useCartDrawer()
  const { data: categories = [] } = useCategories()

  const callbackPath = withLocalePath(pathname || '/', locale)
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`

  return (
    <header className="sticky top-0 z-50 border-b border-teal-200/80 bg-white/80 shadow-[0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-teal-900/50 dark:bg-slate-950/90 dark:shadow-[0_1px_0_rgba(20,184,166,0.08)]">
      <AnnouncementBar />

      <div className={cn(storefrontContainerClass, 'py-3')}>
        <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-linear-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="bg-linear-to-r from-teal-600 to-cyan-500 bg-clip-text text-lg font-bold text-transparent">
                {tCommon('brandName')}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{tCommon('marketplace')}</p>
            </div>
          </Link>

          <CategoryMegaMenu />
          <Suspense fallback={<HeaderSearchFallback />}>
            <HeaderSearch className="min-w-0 flex-1" />
          </Suspense>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            {session?.user?.id ? (
              <Link
                href="/dashboard"
                className="flex flex-col items-center px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-300">
                <User className="h-5 w-5" />
                {firstNameFrom(session.user.name, session.user.email)}
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="flex flex-col items-center px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-300">
                <User className="h-5 w-5" />
                {t('signIn')}
              </Link>
            )}
            <Link
              href={
                session?.user?.id
                  ? '/dashboard/wishlist'
                  : `/login?callbackUrl=${encodeURIComponent(withLocalePath('/dashboard/wishlist', locale))}`
              }
              className="flex flex-col items-center px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-300"
              aria-label={t('wishlistCount', { count: wishlistCount })}>
              <span className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
              {t('wishlist')}
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="flex flex-col items-center px-1.5 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300"
              aria-label={t('cartCount', { count: itemCount })}>
              <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              {tCommon('cart')}
            </button>
          </div>
        </div>

        <nav className="mt-3 hidden items-center gap-4 overflow-x-auto border-t border-slate-100 pt-3 text-xs font-medium text-slate-600 lg:flex dark:border-slate-800 dark:text-slate-300">
          <Link href="/" className={cn(pathname === '/' && 'text-teal-700 dark:text-teal-400')}>
            {t('home')}
          </Link>
          <Link href="/products" className={cn(pathname.startsWith('/products') && 'text-teal-700 dark:text-teal-400')}>
            {t('flashDeals')}
          </Link>
          {categories.map((link) => (
            <Link
              key={link.id}
              href={`/products?category=${link.slug}`}
              className="whitespace-nowrap hover:text-teal-600 dark:hover:text-teal-400">
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
