'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BadgeCheck, Heart, ShoppingCart, Star, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { addItem } from '@/lib/store/slices/cartSlice'
import {
  selectWishlistProductIds,
  selectWishlistProducts,
} from '@/lib/store/selectors/wishlistSelectors'
import { selectIsInCart, selectProductTotalQuantity } from '@/lib/store/selectors/cartSelectors'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import { getDefaultVariantId } from '@/types/cart'
import { formatCurrency } from '@/lib/utils/cartPricing'
import {
  getProductPromo,
  getProductSeller,
  hasFreeDelivery,
  isSoldOut,
} from '@/lib/utils/productDisplay'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types/cart'

function WishlistSkeletonGrid() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li
          key={index}
          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function WishlistProductCard({
  product,
  index,
  onRemove,
}: {
  product: Product
  index: number
  onRemove: () => void
}) {
  const dispatch = useAppDispatch()
  const { openCart } = useCartDrawer()
  const defaultVariantId = getDefaultVariantId(product)
  const quantity = useAppSelector(selectProductTotalQuantity(product.id))
  const inCart = useAppSelector(selectIsInCart(product.id))
  const soldOut = isSoldOut(product)
  const promo = getProductPromo(product)
  const seller = getProductSeller(product)
  const freeDelivery = hasFreeDelivery(product)

  function handleAddToCart() {
    if (soldOut) return
    dispatch(
      addItem({
        productId: product.id,
        variantId: defaultVariantId,
        product,
      }),
    )
    openCart()
    toast.success('Added to cart')
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-teal-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10 dark:border-teal-900/40 dark:bg-slate-950 dark:hover:shadow-teal-500/15"
    >
      <div className="relative">
        <span className="absolute top-3 left-3 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          -{promo.discountPercent}%
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900/95 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        </button>

        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[4/3] overflow-hidden bg-linear-to-br from-slate-100 via-white to-teal-50 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950/40"
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-5xl">{product.emoji}</span>
          )}
          {soldOut ? (
            <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-md bg-slate-900/80 py-2 text-center text-xs font-bold tracking-wide text-white uppercase">
              Sold out
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-1 text-[11px] text-cyan-700 dark:text-cyan-400">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">{seller}</span>
        </div>

        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
          <Link href={`/products/${product.slug}`} className="hover:text-teal-700 dark:hover:text-teal-400">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-0.5 font-medium text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            {product.rating.toFixed(1)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-medium',
              soldOut
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            )}
          >
            {soldOut ? 'Out of stock' : 'In stock'}
          </span>
          {freeDelivery ? (
            <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
              <Truck className="h-3 w-3" />
              Free delivery
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-teal-700 tabular-nums dark:text-teal-400">
            {formatCurrency(product.price)}
          </span>
          <span className="text-xs text-slate-400 line-through dark:text-slate-500">
            {formatCurrency(promo.originalPrice)}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button
            type="button"
            size="sm"
            disabled={soldOut}
            className="w-full gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {soldOut ? 'Sold out' : inCart ? `In cart (${quantity})` : 'Add to cart'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full gap-2 border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from wishlist
          </Button>
        </div>
      </div>
    </motion.li>
  )
}

export function AccountWishlistPanel() {
  const products = useAppSelector(selectWishlistProducts)
  const productIds = useAppSelector(selectWishlistProductIds)
  const hydrated = useAppSelector((state) => state.wishlist.hydrated)
  const { toggle } = useWishlist()

  if (!hydrated) {
    return <WishlistSkeletonGrid />
  }

  if (productIds.length === 0) {
    return (
      <AccountEmptyState
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it for later. We'll keep your picks here until you're ready to buy."
        icon={<Heart className="h-9 w-9" strokeWidth={1.5} />}
      />
    )
  }

  if (products.length === 0) {
    return <WishlistSkeletonGrid />
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <WishlistProductCard
          key={product.id}
          product={product}
          index={index}
          onRemove={() => void toggle(product.id, product)}
        />
      ))}
    </ul>
  )
}
