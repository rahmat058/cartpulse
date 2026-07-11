'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  Heart,
  Minus,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import { useAppDispatch } from '@/lib/store/hooks'
import { addItem, setQuantity, upsertProducts } from '@/lib/store/slices/cartSlice'
import {
  getCartLineKey,
  getDefaultVariantId,
  getInStockVariants,
  getProductDisplayEmoji,
  getProductStock,
  type Product,
} from '@/types/cart'
import type { StoreProfile } from '@/lib/services/stores'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { cn } from '@/lib/utils/cn'
import { getProductSeller, hasFreeDelivery, getDeliveryEta } from '@/lib/utils/productDisplay'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCartDrawer } from '@/components/providers/CartDrawerProvider'
import { ColorVariantPicker } from '@/components/catalog/ColorVariantPicker'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { ProductTabs } from '@/components/storefront/ProductTabs'
import type { ProductReviewItem } from '@/lib/services/reviews'
import { RelatedProducts } from '@/components/storefront/RelatedProducts'
import { Button } from '@/components/ui/Button'
import { pushRecentlyViewed } from '@/components/storefront/HomeShelves'
import { normalizeProductImageUrls } from '@/lib/utils/product-images'

export function ProductDetailView({
  product,
  related = [],
  store = null,
  initialReviews = [],
}: {
  product: Product
  related?: Product[]
  store?: StoreProfile | null
  initialReviews?: ProductReviewItem[]
}) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { openCart } = useCartDrawer()
  const { wished, toggle } = useWishlist(product.id)
  const [selectedVariantId, setSelectedVariantId] = useState(() => getDefaultVariantId(product) ?? undefined)
  const [selectedImage, setSelectedImage] = useState(0)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const availableVariants = useMemo(() => getInStockVariants(product), [product])

  useEffect(() => {
    dispatch(upsertProducts([product, ...related]))
  }, [dispatch, product, related])

  useEffect(() => {
    pushRecentlyViewed(product.id)
  }, [product.id])

  useEffect(() => {
    if (availableVariants.length === 0) return
    if (!selectedVariantId || !availableVariants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(getDefaultVariantId(product))
    }
  }, [availableVariants, product, selectedVariantId])

  const activeVariantId = selectedVariantId ?? getDefaultVariantId(product)
  const stock = getProductStock(product, activeVariantId)
  const lineKey = getCartLineKey(product.id, activeVariantId)
  const atMax = buyQuantity >= stock
  const displayEmoji = getProductDisplayEmoji(product, activeVariantId)
  const pricing = ProductPricing.for(product)
  const sellerName = store?.name ?? getProductSeller(product)
  const storeHref = product.storeSlug ? `/stores/${product.storeSlug}` : null
  const galleryImages = normalizeProductImageUrls(product.imageUrls, product.imageUrl)
  const thumbs = galleryImages
  const activeImage = thumbs[selectedImage]
  const hasReviews = product.rating > 0

  const activeVariant = product.variants?.find((variant) => variant.id === activeVariantId)
  const sku = activeVariant?.sku ?? product.slug.replace(/-/g, '').toUpperCase()
  const sellerSpec = store?.verified ? `${sellerName} · Official Store` : sellerName
  const availabilitySpec = product.isDigital
    ? 'Digital download'
    : stock > 0
      ? `In stock (${stock} available)`
      : 'Out of stock'

  function addWithQuantity(redirectToCheckout = false) {
    if (stock < 1) return
    dispatch(addItem({ productId: product.id, variantId: activeVariantId, product }))
    dispatch(
      setQuantity({
        lineKey,
        productId: product.id,
        variantId: activeVariantId,
        quantity: buyQuantity,
      }),
    )
    if (redirectToCheckout) {
      router.push('/checkout')
      return
    }
    openCart()
  }

  return (
    <StorefrontContainer as="main" className="py-8">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: product.category, href: `/products?category=${product.category}` },
          { label: product.name },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
          <div>
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-linear-to-b from-cyan-50 to-slate-50 text-8xl dark:from-slate-900 dark:to-slate-950">
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-6" />
              ) : (
                displayEmoji
              )}
              {pricing.hasDiscount && (
                <span className="absolute top-4 left-4 rounded-md bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                  -{pricing.discountPercent}% OFF
                </span>
              )}
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-teal-600" />
                Official
              </span>
            </div>
            {thumbs.length > 1 ? (
              <div className="mt-3 flex gap-2">
                {thumbs.map((thumb, index) => (
                  <button
                    key={`${thumb}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border',
                      selectedImage === index ? 'border-teal-500' : 'border-slate-200',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5 text-sm text-teal-700">
                <BadgeCheck className="h-4 w-4" />
                <span className="font-semibold">{sellerName}</span>
                <span>· Official</span>
              </div>
              {storeHref ? (
                <Link
                  href={storeHref}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200/80 transition-colors hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800/80">
                  Visit store
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>

            <h1 className="text-2xl leading-tight font-bold text-slate-900 sm:text-3xl dark:text-slate-100">
              {product.name}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-sm">
              {hasReviews ? (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-800">{product.rating.toFixed(1)}</span>
                  <span className="text-slate-400">· customer rating</span>
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-slate-500">New — no reviews yet</span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(pricing.salePrice)}
              </span>
              {pricing.hasDiscount && (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatCurrency(pricing.originalPrice)}</span>
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                    SAVE {pricing.discountPercent}%
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
              <Banknote className="h-4 w-4 shrink-0" />
              Cash on Delivery — pay only when it arrives
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {pricing.hasDiscount && (
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  Save {pricing.discountPercent}% — down from {formatCurrency(pricing.originalPrice)}
                </li>
              )}
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                Fast delivery · {getDeliveryEta(product)}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                Cash on Delivery — pay only when it arrives
              </li>
            </ul>

            {availableVariants.length > 0 && activeVariantId && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {product.variantType === 'SIZE' ? 'Size' : 'Color'}
                </p>
                <ColorVariantPicker
                  variants={availableVariants}
                  variantType={product.variantType ?? 'COLOR'}
                  selectedId={activeVariantId}
                  onChange={setSelectedVariantId}
                />
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Quantity</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-md border border-teal-200 bg-white dark:border-teal-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setBuyQuantity((qty) => Math.max(1, qty - 1))}
                    className="px-3 py-2 text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-950/50"
                    aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 border-x border-teal-200 px-3 py-2 text-center text-sm font-semibold text-slate-800 tabular-nums dark:border-teal-800 dark:text-slate-100">
                    {buyQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuyQuantity((qty) => Math.min(stock, qty + 1))}
                    disabled={atMax || stock < 1}
                    className="px-3 py-2 text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-950/50"
                    aria-label="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-sm',
                    stock > 0 ? 'text-teal-700 dark:text-teal-400' : 'text-rose-600 dark:text-rose-500',
                  )}>
                  <span
                    className={cn('h-2 w-2 rounded-full', stock > 0 ? 'bg-teal-500' : 'bg-rose-600 dark:bg-rose-500')}
                  />
                  {product.isDigital
                    ? 'Instant download after purchase'
                    : stock > 0
                      ? 'In stock, ready to ship'
                      : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                disabled={stock < 1}
                onClick={() => addWithQuantity(false)}
                className="h-11 min-w-[140px] border-transparent bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500 px-4 text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600 disabled:opacity-50">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                disabled={stock < 1}
                onClick={() => addWithQuantity(true)}
                className="h-11 min-w-[140px] px-4">
                Buy Now
              </Button>
              <button
                type="button"
                onClick={() => void toggle(product.id, product)}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors',
                  wished
                    ? 'border-rose-500 text-rose-500 hover:border-rose-600 hover:text-rose-600 dark:border-rose-500'
                    : 'border-teal-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 dark:border-teal-800 dark:hover:text-teal-400',
                )}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
                <Heart className={cn('h-5 w-5', wished && 'fill-rose-500 text-rose-500')} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <Truck className="mb-1 h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {product.isDigital ? 'Digital delivery' : 'Fast delivery'}
                </p>
                <p className="text-[11px] text-slate-500">{getDeliveryEta(product)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <Shield className="mb-1 h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">7-day returns</p>
                <p className="text-[11px] text-slate-500">CartPulse buyer protection</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <Banknote className="mb-1 h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Cash on Delivery</p>
                <p className="text-[11px] text-slate-500">
                  {hasFreeDelivery(product) ? 'Free delivery eligible' : 'Pay at your door'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ProductTabs
        description={product.description}
        specs={[
          { label: 'Seller', value: sellerSpec },
          { label: 'SKU', value: sku },
          { label: 'Availability', value: availabilitySpec },
        ]}
        productId={product.id}
        initialReviews={initialReviews}
      />

      <RelatedProducts products={related} />
    </StorefrontContainer>
  )
}
