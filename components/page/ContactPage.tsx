import { getTranslations } from 'next-intl/server'
import { Mail, MapPin, Phone } from 'lucide-react'
import { InfoPageLayout, InfoSection } from '@/components/page/InfoPageLayout'

export async function ContactPage() {
  const t = await getTranslations('pages.contact')

  const channels = [
    { icon: Mail, label: t('channels.email.label'), value: t('channels.email.value'), href: `mailto:${t('channels.email.value')}` },
    { icon: Phone, label: t('channels.phone.label'), value: t('channels.phone.value'), href: `tel:${t('channels.phone.value').replace(/\s/g, '')}` },
    { icon: MapPin, label: t('channels.address.label'), value: t('channels.address.value') },
  ]

  return (
    <InfoPageLayout title={t('title')} subtitle={t('subtitle')}>
      <InfoSection title={t('reachUs.title')}>
        <p>{t('reachUs.body')}</p>
        <ul className="mt-4 space-y-4">
          {channels.map((channel) => (
            <li key={channel.label} className="flex items-start gap-3">
              <channel.icon className="mt-0.5 size-5 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>
                <span className="block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {channel.label}
                </span>
                {channel.href ? (
                  <a href={channel.href} className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
                    {channel.value}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{channel.value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title={t('hours.title')}>
        <p>{t('hours.weekdays')}</p>
        <p>{t('hours.weekend')}</p>
      </InfoSection>

      <InfoSection title={t('orders.title')}>
        <p>{t('orders.body')}</p>
      </InfoSection>
    </InfoPageLayout>
  )
}
