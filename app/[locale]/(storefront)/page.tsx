import { setRequestLocale } from 'next-intl/server'
import { HomePage } from '@/components/page/HomePage'

/** Revalidate homepage HTML/data every 60s (ISR). Do not use force-dynamic here. */
export const revalidate = 60

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <HomePage />
}
