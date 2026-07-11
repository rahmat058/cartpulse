import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { HelpFaq } from '@/components/page/HelpFaq'
import { InfoPageLayout, InfoSection } from '@/components/page/InfoPageLayout'
import { ArrowRight, Mail, MessageCircle, Package, Shield } from 'lucide-react'

export async function HelpCenterPage() {
  const t = await getTranslations('pages.help')

  const quickLinks = [
    { href: '/dashboard/orders' as const, icon: Package, label: t('quickLinks.orders'), desc: t('quickLinks.ordersDesc') },
    { href: '/cart' as const, icon: MessageCircle, label: t('quickLinks.cart'), desc: t('quickLinks.cartDesc') },
    { href: '/contact' as const, icon: Mail, label: t('quickLinks.contact'), desc: t('quickLinks.contactDesc') },
    { href: '/terms' as const, icon: Shield, label: t('quickLinks.terms'), desc: t('quickLinks.termsDesc') },
  ]

  return (
    <InfoPageLayout title={t('title')} subtitle={t('subtitle')}>
      <InfoSection title={t('quickLinks.title')}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/50 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-teal-700 dark:hover:bg-teal-950/30">
                <item.icon className="mt-0.5 size-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.label}
                    <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </InfoSection>

      <HelpFaq />

      <InfoSection title={t('stillNeedHelp.title')}>
        <p>{t('stillNeedHelp.body')}</p>
        <Link href="/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-teal-400">
          {t('stillNeedHelp.cta')}
          <ArrowRight className="size-4" />
        </Link>
      </InfoSection>
    </InfoPageLayout>
  )
}
