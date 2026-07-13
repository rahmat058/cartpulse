'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BadgeCheck, Heart, ShoppingCart, Star, Truck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { addItem } from '@/lib/store/slices/cartSlice'
import { selectIsInCart, selectProductTotalQuantity } from '@/lib/store/selectors/cartSelectors'
import { getDefaultVariantId, getInStockVariants, getProductStock } from '@/lib/types/cart'
import { formatCurrency } from '@/lib/utils/cartPricing'
import {
  getDeliveryEta,
  getProductPromo,
  getProductSeller,
  hasFreeDelivery,
  isNewProduct,
  isSoldOut,
} from '@/lib/utils/productDisplay'
import { repairProductImageUrl } from '@/lib/utils/product-images'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import { cn } from '@/lib/utils/cn'
import { stripRichText } from '@/lib/utils/rich-text'
import type { Product } from '@/lib/types/cart'

interface ProductCardProps {
  product: Product
  index: number
  linkToDetail?: boolean
  layout?: 'compact' | 'catalog-grid' | 'catalog-list'
  onBuyNow?: () => void
}

export function ProductCard({ product, index, linkToDetail = false, layout = 'compact', onBuyNow }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const quantity = useAppSelector(selectProductTotalQuantity(product.id))
  const inCart = useAppSelector(selectIsInCart(product.id))
  const inStockVariants = useMemo(() => getInStockVariants(product), [product])
  const defaultVariantId = getDefaultVariantId(product)
  const stock = getProductStock(product, defaultVariantId)
  const soldOut = isSoldOut(product)
  const atMax = quantity >= stock
  const { wished, toggle } = useWishlist(product.id)
  const { openCart } = useCartDrawer()

  const promo = getProductPromo(product)
  const seller = getProductSeller(product)
  const freeDelivery = hasFreeDelivery(product)
  const isNew = isNewProduct(product)
  const isDigital = Boolean(product.isDigital)

  const handleBuyNow = () => {
    if (!atMax && !soldOut) {
      dispatch(addItem({ productId: product.id, variantId: defaultVariantId, product }))
      openCart()
    }
    onBuyNow?.()
  }

  const handleWishlist = () => {
    void toggle(product.id, product)
  }

  if (layout === 'catalog-list') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02, duration: 0.3 }}
        className="flex gap-4 rounded-md border border-teal-100/80 bg-white/90 p-4 transition-shadow hover:shadow-md hover:shadow-teal-500/10 dark:border-teal-900/40 dark:bg-slate-900/75 dark:hover:shadow-teal-500/15">
        <Link
          href={`/products/${product.slug}`}
          className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-teal-50 to-cyan-50 text-4xl dark:from-teal-950/60 dark:to-slate-900">
          <ProductThumb product={product} />
          {soldOut && <SoldOutBadge className="text-[10px]" />}
          {isDigital && !soldOut && <DigitalBadge className="text-[10px]" />}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-cyan-700 dark:text-cyan-400">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span className="font-medium">{seller}</span>
              <span className="text-teal-600 dark:text-teal-400">Verified</span>
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Link href={`/products/${product.slug}`} className="hover:text-teal-700 dark:hover:text-teal-400">
                {product.name}
              </Link>
            </h3>

            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{stripRichText(product.description)}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {product.rating}
              </span>
              {isNew && <Tag label="New" />}
              {isDigital && <Tag label="Digital" />}
              {freeDelivery && (
                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <Truck className="h-3 w-3" />
                  Free delivery
                </span>
              )}
              <span className="text-slate-400">{getDeliveryEta(product)}</span>
            </div>
          </div>

          <div className="mt-3 flex shrink-0 flex-col items-end justify-between gap-3 sm:mt-0 sm:min-w-[140px]">
            <PriceBlock
              price={product.price}
              originalPrice={promo.originalPrice}
              discountPercent={promo.discountPercent}
            />
            <button
              type="button"
              disabled={soldOut || atMax}
              onClick={handleBuyNow}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 sm:w-auto">
              <ShoppingCart className="h-4 w-4" />
              {soldOut ? 'Sold out' : inCart ? `In cart (${quantity})` : 'Buy Now'}
            </button>
          </div>
        </div>
      </motion.article>
    )
  }

  if (layout === 'catalog-grid') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.35 }}
        className="group flex h-full flex-col overflow-hidden rounded-md border border-teal-100/80 bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10 dark:border-teal-900/40 dark:bg-slate-900/75 dark:hover:shadow-teal-500/15">
        <div className="relative">
          <span className="absolute top-2 left-2 z-10 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{promo.discountPercent}%
          </span>
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 shadow-sm transition-colors hover:text-rose-500 dark:bg-slate-800/90 dark:text-slate-400"
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
            <Heart className={cn('h-4 w-4', wished && 'fill-rose-500 text-rose-500')} />
          </button>

          <Link
            href={`/products/${product.slug}`}
            className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-teal-50 via-white to-cyan-50 text-5xl dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900">
            <ProductThumb product={product} />
            {soldOut && <SoldOutBadge />}
            {isDigital && !soldOut && <DigitalBadge />}
          </Link>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] text-cyan-700 dark:text-cyan-400">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{seller}</span>
            <span className="shrink-0 text-teal-600 dark:text-teal-400">Verified</span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Link href={`/products/${product.slug}`} className="hover:text-teal-700 dark:hover:text-teal-400">
              {product.name}
            </Link>
          </h3>

          <div className="mt-2">
            <PriceBlock
              price={product.price}
              originalPrice={promo.originalPrice}
              discountPercent={promo.discountPercent}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isNew && <Tag label="New" />}
            {isDigital && <Tag label="Digital" />}
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              {product.rating}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-teal-50 pt-3 text-[11px] text-slate-500 dark:border-teal-900/40 dark:text-slate-400">
            {freeDelivery ? (
              <span className="flex items-center gap-1 text-teal-600">
                <Truck className="h-3 w-3" />
                Free delivery
              </span>
            ) : (
              <span>Standard shipping</span>
            )}
            <span>{getDeliveryEta(product)}</span>
          </div>

          <button
            type="button"
            disabled={soldOut || atMax}
            onClick={handleBuyNow}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-950/60">
            <ShoppingCart className="h-4 w-4" />
            {soldOut ? 'Sold out' : inCart ? `In cart (${quantity})` : 'Buy Now'}
          </button>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="flex h-full flex-col rounded-md border border-teal-100/80 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10 dark:border-teal-900/40 dark:bg-slate-900/75 dark:hover:shadow-teal-500/15">
      <div className="mb-3 flex h-16 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-teal-50 to-cyan-50 text-3xl dark:from-teal-950/60 dark:to-slate-900">
        <ProductThumb product={product} />
      </div>

      <div className="mb-1 flex items-center gap-1 text-xs text-amber-500">
        <Star className="h-3 w-3 fill-current" />
        <span className="font-medium">{product.rating}</span>
        <span className="text-slate-400 dark:text-slate-500">· {product.stock} in stock</span>
        {inStockVariants.length > 0 && (
          <span className="text-slate-400 dark:text-slate-500">
            · {inStockVariants.length} {product.variantType === 'SIZE' ? 'sizes' : 'colors'}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {linkToDetail ? (
          <Link href={`/products/${product.slug}`} className="hover:text-teal-700 dark:hover:text-teal-400">
            {product.name}
          </Link>
        ) : (
          product.name
        )}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500 dark:text-slate-400">{stripRichText(product.description)}</p>

      <div className="mt-4 flex items-end justify-between gap-2">
        <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatCurrency(product.price)}</span>
        <button
          type="button"
          disabled={atMax}
          onClick={handleBuyNow}
          className="inline-flex items-center gap-1.5 rounded-md bg-linear-to-r from-teal-500 to-cyan-500 px-3 py-1.5 text-sm font-semibold text-white shadow-md disabled:opacity-50">
          Add
        </button>
      </div>
    </motion.article>
  )
}

function ProductThumb({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false)
  const src =
    product.imageUrl
      ? repairProductImageUrl(product.imageUrl, {
          categorySlug: product.category,
          productId: product.id,
        })
      : undefined

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }
  return <>{product.emoji}</>
}

function PriceBlock({
  price,
  originalPrice,
  discountPercent,
}: {
  price: number
  originalPrice: number
  discountPercent: number
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatCurrency(price)}</span>
      <span className="text-xs text-slate-400 line-through dark:text-slate-500">{formatCurrency(originalPrice)}</span>
      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
        -{discountPercent}%
      </span>
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
      {label}
    </span>
  )
}

function SoldOutBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute inset-x-3 top-1/2 -translate-y-1/2 rounded bg-slate-900/75 py-1.5 text-center text-xs font-bold tracking-wider text-white uppercase',
        className,
      )}>
      Sold out
    </span>
  )
}

function DigitalBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'absolute left-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white',
        className,
      )}>
      Digital
    </span>
  )
}
