'use client'

import { ProductCard } from '@/components/catalog/ProductCard'
import { ShelfSeeAllLink } from '@/components/storefront/ShelfSeeAllLink'
import { useShelfItemLimit } from '@/hooks/use-shelf-item-limit'
import type { Product } from '@/types/cart'

export function ProductShelfGrid({
  products,
  seeAllHref,
  seeAllLabel,
}: {
  products: Product[]
  seeAllHref?: string
  seeAllLabel?: string
}) {
  const limit = useShelfItemLimit()
  const visible = products.slice(0, limit)
  const hasMore = products.length > visible.length

  if (visible.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            layout="catalog-grid"
            linkToDetail
          />
        ))}
      </div>
      {hasMore && seeAllHref ? (
        <ShelfSeeAllLink href={seeAllHref} label={seeAllLabel ?? 'See all products'} />
      ) : null}
    </>
  )
}
