import { CatalogPageSkeleton } from '@/components/catalog/CatalogSkeleton'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

/**
 * Route-level loading UI for `/products`.
 * Defaults to the flash-deals layout; the page Suspense fallback refines category vs products from the URL.
 */
export default function ProductsLoading() {
  return (
    <StorefrontContainer as="main" className="py-8">
      <CatalogPageSkeleton variant="products" />
    </StorefrontContainer>
  )
}
