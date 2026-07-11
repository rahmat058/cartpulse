'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AccountEmptyState({
  title,
  description,
  actionHref = '/products',
  actionLabel = 'Start shopping',
  icon,
}: {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        {icon ?? <Package className="h-9 w-9" strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      <Link href={actionHref} className="mt-6">
        <Button>{actionLabel}</Button>
      </Link>
    </div>
  )
}
