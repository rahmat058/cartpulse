'use client'

import { Marquee } from '@/components/ui/Marquee'
import { ProductCard } from '@/components/catalog/ProductCard'
import type { Product } from '@/types/cart'

interface ProductMarqueeProps {
  products: Product[]
  /** Full loop duration in seconds. Higher = slower. */
  duration?: number
  /** Minimum products before infinite scroll runs. */
  minItems?: number
}

export function ProductMarquee({ products, duration = 90, minItems = 5 }: ProductMarqueeProps) {
  if (products.length === 0) return null

  return (
    <Marquee duration={duration} gap="gap-4" minItems={minItems}>
      {products.map((product) => (
        <div key={product.id} className="w-[200px] shrink-0 sm:w-[220px]">
          <ProductCard product={product} index={0} layout="catalog-grid" linkToDetail />
        </div>
      ))}
    </Marquee>
  )
}
