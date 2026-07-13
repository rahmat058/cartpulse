import { notFound } from 'next/navigation'
import { getProductBySlug, getProducts } from '@/lib/services/products'
import { listProductReviews } from '@/lib/services/reviews'
import { getStoreProfile } from '@/lib/services/stores'
import { ProductDetailView } from '@/components/page/ProductDetailView'

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const store = product.storeSlug ? await getStoreProfile(product.storeSlug) : null

  const relatedCatalog = await getProducts({
    category: product.category,
    sortBy: 'rating-desc',
    pageSize: 5,
  })
  const related = relatedCatalog.data.filter((p) => p.slug !== slug).slice(0, 4)
  const initialReviews = await listProductReviews(product.id)

  return (
    <ProductDetailView
      product={product}
      related={related}
      store={store}
      initialReviews={initialReviews}
    />
  )
}
