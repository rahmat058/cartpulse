import { CatalogPageSkeleton } from '@/components/catalog/CatalogSkeleton'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

/** Instant loading UI for `/products` and `/products?category=…` only (not PDP). */
export default function ProductsCatalogLoading() {
  return (
    <StorefrontContainer as="main" className="py-8">
      <CatalogPageSkeleton variant="products" />
    </StorefrontContainer>
  )
}
