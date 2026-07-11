import { notFound } from 'next/navigation'
import { getStoreProfile } from '@/lib/services/stores'
import { StorePageClient } from '@/components/page/StorePageClient'

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStoreProfile(slug)

  if (!store) notFound()

  return <StorePageClient store={store} />
}
