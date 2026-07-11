'use client'

import type { Product } from '@/types/cart'
import { ProductCard } from '@/components/catalog/ProductCard'

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">You may also like</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} layout="catalog-grid" linkToDetail />
        ))}
      </div>
    </section>
  )
}
