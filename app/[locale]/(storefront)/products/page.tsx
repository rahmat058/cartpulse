import { Suspense } from 'react'
import { AdvancedCatalogPage } from '@/components/page/AdvancedCatalogPage'
import { CatalogSkeleton } from '@/components/catalog/CatalogSkeleton'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <StorefrontContainer as="main" className="py-8">
          <div className="glass-card p-6">
            <CatalogSkeleton />
          </div>
        </StorefrontContainer>
      }
    >
      <AdvancedCatalogPage />
    </Suspense>
  )
}
