import { setRequestLocale } from 'next-intl/server'
import { HomePage } from '@/components/page/HomePage'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <HomePage />
}
