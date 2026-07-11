'use client'

import Link from 'next/link'
import { useCategories } from '@/hooks/use-categories'

export function CategoryTiles() {
  const { data: categories = [] } = useCategories()

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Shop by category</h2>
        <Link href="/products" className="text-sm font-medium text-teal-600 hover:underline">
          All products
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((tile) => (
          <Link
            key={tile.id}
            href={`/products?category=${tile.slug}`}
            className="glass-card flex flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-teal-50 to-cyan-50 text-2xl">
              {tile.emoji ?? '📦'}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {tile.name}
            </span>
            <span className="text-[11px] text-slate-400">{tile.productCount} items</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
