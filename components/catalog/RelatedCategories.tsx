'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Marquee } from '@/components/ui/Marquee'
import type { ResolvedCategory } from '@/lib/catalog/category-context'

interface RelatedCategoriesProps {
  categories: ResolvedCategory[]
}

export function RelatedCategories({ categories }: RelatedCategoriesProps) {
  if (categories.length === 0) return null

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Related categories</h2>
        <span className="text-sm text-slate-400">
          {categories.length} option{categories.length === 1 ? '' : 's'}
        </span>
      </div>

      <Marquee duration={70} gap="gap-3" minItems={4}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="group flex w-[240px] shrink-0 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-teal-200 hover:bg-teal-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-teal-900 dark:hover:bg-teal-950/30">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {category.emoji ?? category.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {category.name}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
          </Link>
        ))}
      </Marquee>
    </section>
  )
}
