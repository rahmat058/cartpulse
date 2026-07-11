import { getHeroSlides } from '@/lib/commerce/hero-slides'
import { HomeShelves } from '@/components/storefront/HomeShelves'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { HeroBanner } from '@/components/storefront/HeroBanner'
import { TrustBadges } from '@/components/layout/TrustBadges'
import { getTranslations } from 'next-intl/server'
import { HomePageComposer, type HomeShelfPayload } from '@/lib/commerce/HomeShelfStrategy'

function translateShelves(
  shelves: HomeShelfPayload[],
  t: Awaited<ReturnType<typeof getTranslations>>,
): HomeShelfPayload[] {
  return shelves.map((shelf) => ({
    ...shelf,
    title: t(`shelves.${shelf.kind}.title`),
    subtitle: t(`shelves.${shelf.kind}.subtitle`),
  }))
}

export async function HomePage() {
  const t = await getTranslations('home')
  const composer = new HomePageComposer()
  const [shelves, heroSlides] = await Promise.all([composer.compose(), getHeroSlides()])

  return (
    <StorefrontContainer as="main" className="space-y-10 py-8">
      <HeroBanner slides={heroSlides} />
      <HomeShelves shelves={translateShelves(shelves, t)} />
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">{t('whyShop')}</h2>
        <TrustBadges />
      </section>
    </StorefrontContainer>
  )
}
