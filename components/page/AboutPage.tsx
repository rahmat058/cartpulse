import { getTranslations } from 'next-intl/server'
import { InfoPageLayout, InfoSection } from '@/components/page/InfoPageLayout'

const VALUE_KEYS = ['marketplace', 'secure', 'dashboard'] as const

export async function AboutPage() {
  const t = await getTranslations('pages.about')

  return (
    <InfoPageLayout title={t('title')} subtitle={t('subtitle')}>
      <InfoSection>
        <p>{t('intro')}</p>
      </InfoSection>

      <InfoSection title={t('mission.title')}>
        <p>{t('mission.body')}</p>
      </InfoSection>

      <InfoSection title={t('values.title')}>
        <ul className="list-disc space-y-2 pl-5">
          {VALUE_KEYS.map((key) => (
            <li key={key}>
              <strong className="font-semibold text-slate-800 dark:text-slate-100">{t(`values.${key}.title`)}</strong>
              {' — '}
              {t(`values.${key}.body`)}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title={t('stack.title')}>
        <p>{t('stack.body')}</p>
      </InfoSection>
    </InfoPageLayout>
  )
}
