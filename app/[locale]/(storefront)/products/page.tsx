import { Suspense } from 'react'
import { AdvancedCatalogPage } from '@/components/page/AdvancedCatalogPage'
import { CatalogPageSkeleton } from '@/components/catalog/CatalogSkeleton'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <StorefrontContainer as="main" className="py-8">
          <CatalogPageSkeleton variant="products" />
        </StorefrontContainer>
      }>
      <AdvancedCatalogPage />
    </Suspense>
  )
}
