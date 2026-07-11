'use client'

import { cn } from '@/lib/utils/cn'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Heart, ShoppingCart } from 'lucide-react'
import { storefrontContainerClass } from '@/components/layout/StorefrontContainer'

export function Footer() {
  const t = useTranslations('footer')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')

  const footerLinks = {
    shop: [
      { href: '/products' as const, label: t('allProducts') },
      { href: '/products?sort=rating-desc' as const, label: t('topRated') },
      { href: '/products?category=electronics-gadget' as const, label: t('electronics') },
      { href: '/products?category=fashion' as const, label: t('fashion') },
    ],
    account: [
      { href: '/login' as const, label: tNav('signIn') },
      { href: '/register' as const, label: t('createAccount') },
      { href: '/dashboard/orders' as const, label: t('myOrders') },
      { href: '/cart' as const, label: tCommon('cart') },
    ],
    support: [
      { href: '/help' as const, label: t('helpCenter') },
      { href: '/about' as const, label: t('about') },
      { href: '/contact' as const, label: t('contact') },
      { href: '/terms' as const, label: t('terms') },
      { href: '/checkout' as const, label: t('checkout') },
      { href: '/dashboard/library' as const, label: t('digitalLibrary') },
    ],
  }

  const sections = [
    { title: t('shop'), links: footerLinks.shop },
    { title: t('account'), links: footerLinks.account },
    { title: t('support'), links: footerLinks.support },
  ]

  return (
    <footer className="mt-auto border-t border-teal-200/80 bg-slate-900 text-slate-300">
      <div className={cn(storefrontContainerClass, 'py-10')}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5 text-teal-400" />
              <span className="font-bold">{tCommon('brandName')}</span>
            </div>
            <p className="text-sm text-slate-400">{t('description')}</p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-xs font-bold tracking-wider text-white uppercase">{section.title}</h3>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="hover:text-teal-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/terms" className="hover:text-teal-300">
              {t('terms')}
            </Link>
            <Link href="/contact" className="hover:text-teal-300">
              {t('contact')}
            </Link>
            <p className="flex items-center gap-1">
              {t.rich('madeWith', {
                heart: () => <Heart className="h-3 w-3 fill-teal-400 text-teal-400" />,
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
