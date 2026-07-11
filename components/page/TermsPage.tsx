import { getTranslations } from 'next-intl/server'
import { InfoPageLayout, InfoSection } from '@/components/page/InfoPageLayout'

const SECTION_KEYS = ['acceptance', 'accounts', 'orders', 'payments', 'returns', 'liability'] as const

export async function TermsPage() {
  const t = await getTranslations('pages.terms')

  return (
    <InfoPageLayout title={t('title')} subtitle={t('subtitle')}>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('lastUpdated')}</p>

      {SECTION_KEYS.map((key) => (
        <InfoSection key={key} title={t(`sections.${key}.title`)}>
          <p>{t(`sections.${key}.body`)}</p>
        </InfoSection>
      ))}
    </InfoPageLayout>
  )
}
