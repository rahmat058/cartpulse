'use client'

import { Heart } from 'lucide-react'
import { useAppSelector } from '@/lib/store/hooks'
import { selectWishlistCount } from '@/lib/store/selectors/wishlistSelectors'
import { AccountWishlistPanel } from '@/components/account/AccountWishlistPanel'
import { useWishlist } from '@/hooks/use-wishlist'

export default function DashboardWishlistPage() {
  useWishlist()
  const count = useAppSelector(selectWishlistCount)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/50">
              <Heart className="h-4 w-4 fill-current" />
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Wishlist</h2>
          </div>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Products you saved for later
            {count > 0 ? (
              <span className="ml-1.5 font-medium text-teal-700 dark:text-teal-400">
                · {count} {count === 1 ? 'item' : 'items'}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <AccountWishlistPanel />
    </div>
  )
}
