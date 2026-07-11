'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CartEmptyProps {
  variant?: 'panel' | 'drawer'
  onClose?: () => void
}

export function CartEmpty({ variant = 'panel', onClose }: CartEmptyProps) {
  if (variant === 'drawer') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-500">
          <ShoppingCart className="h-9 w-9" />
        </div>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Your cart is empty</p>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          Browse flash deals and add items — your cart persists in localStorage.
        </p>
        <Link href="/products" onClick={onClose} className="mt-6">
          <Button size="lg" className="gap-2.5">
            Continue shopping
            <ArrowRight className="size-5" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-teal-50 text-teal-500">
        <ShoppingCart className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-slate-700">Your cart is empty</p>
      <p className="max-w-xs text-xs text-slate-400">
        Add items from the catalog. Cart persists in localStorage when you refresh.
      </p>
      <Link href="/products">
        <Button variant="outline" size="sm">
          Browse products
        </Button>
      </Link>
    </div>
  )
}
