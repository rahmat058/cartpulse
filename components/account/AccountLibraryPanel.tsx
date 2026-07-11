'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Download, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { formatDateDisplay } from '@/lib/utils/datetime-picker'
import type { UserLibraryItem } from '@/lib/services/library'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'
import { cn } from '@/lib/utils/cn'

function LibraryCard({ item, index }: { item: UserLibraryItem; index: number }) {
  const imageUrl = item.product.imageUrl

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-slate-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">{item.product.emoji}</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Digital
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <Link
            href={`/products/${item.product.slug}`}
            className="line-clamp-2 font-semibold text-slate-800 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400"
          >
            {item.product.name}
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Store className="h-3.5 w-3.5" />
            {item.product.store.name}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-teal-700 dark:text-teal-400">
            {formatCurrency(item.product.price)}
          </span>
          <span className="text-xs text-slate-500">Added {formatDateDisplay(item.createdAt)}</span>
        </div>

        <a
          href={`/api/library/${item.productId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-teal-700 px-2.5 text-sm font-medium text-white',
            'hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500',
          )}
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </motion.li>
  )
}

export function AccountLibraryPanel({ items }: { items: UserLibraryItem[] }) {
  if (items.length === 0) {
    return (
      <AccountEmptyState
        title="Your library is empty"
        description="Digital products you purchase appear here for instant download — eBooks, guides, templates, and more."
        icon={<BookOpen className="h-9 w-9" strokeWidth={1.5} />}
        actionHref="/products"
        actionLabel="Browse catalog"
      />
    )
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <LibraryCard key={item.id} item={item} index={index} />
      ))}
    </ul>
  )
}
