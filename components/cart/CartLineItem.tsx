'use client'

import Link from 'next/link'
import { BadgeCheck, Heart, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWishlist } from '@/hooks/use-wishlist'
import { useAppDispatch } from '@/lib/store/hooks'
import { getProductDisplayEmoji, getProductStock } from '@/lib/types/cart'
import { formatCurrency, getLineTotal } from '@/lib/utils/cartPricing'
import { ProductPricing } from '@/lib/commerce/ProductPricing'
import { getProductSeller } from '@/lib/utils/productDisplay'
import type { Product, ProductVariant } from '@/lib/types/cart'
import { decrementQuantity, incrementQuantity, removeItem, setQuantity } from '@/lib/store/slices/cartSlice'

interface CartLineItemProps {
  lineKey: string
  productId: string
  variantId?: string
  quantity: number
  product: Product
  variant?: ProductVariant
  compact?: boolean
  drawer?: boolean
}

export function CartLineItem({
  lineKey,
  productId,
  variantId,
  quantity,
  product,
  variant,
  compact = false,
  drawer = false,
}: CartLineItemProps) {
  const dispatch = useAppDispatch()
  const { toggle } = useWishlist(productId)
  const lineTotal = getLineTotal(product, quantity, variantId)
  const stock = getProductStock(product, variantId)
  const atMax = quantity >= stock
  const emoji = getProductDisplayEmoji(product, variantId)
  const pricing = ProductPricing.for(product)
  const seller = getProductSeller(product)
  const lineSavings = Math.max(0, pricing.originalPrice - pricing.salePrice) * quantity

  async function saveForLater() {
    await toggle(productId, product)
    dispatch(removeItem(lineKey))
    toast.success('Saved for later')
  }

  if (drawer) {
    return (
      <li className="border-b border-slate-100 py-4 last:border-0">
        <div className="flex gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 text-2xl">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              emoji
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              <button
                type="button"
                onClick={() => dispatch(removeItem(lineKey))}
                className="shrink-0 text-slate-300 transition-colors hover:text-rose-500"
                aria-label={`Remove ${product.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatCurrency(pricing.salePrice)} each · {stock} available
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center rounded-full border border-teal-200 bg-white">
                <button
                  type="button"
                  onClick={() => dispatch(decrementQuantity(lineKey))}
                  className="rounded-l-full px-3 py-1.5 text-teal-600 hover:bg-teal-50"
                  aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 border-x border-teal-100 px-2 py-1.5 text-center text-sm font-semibold text-slate-800 tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(incrementQuantity(lineKey))}
                  disabled={atMax}
                  className="rounded-r-full px-3 py-1.5 text-teal-600 hover:bg-teal-50 disabled:opacity-40"
                  aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-base font-bold text-teal-600 tabular-nums">{formatCurrency(lineTotal)}</p>
            </div>
          </div>
        </div>
      </li>
    )
  }

  if (compact) {
    return (
      <li className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-teal-50 text-xl">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            emoji
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
          <p className="text-xs text-slate-500">
            Qty {quantity} · {formatCurrency(pricing.salePrice)} each
          </p>
        </div>
        <p className="text-sm font-bold text-slate-900 tabular-nums dark:text-slate-100">{formatCurrency(lineTotal)}</p>
      </li>
    )
  }

  return (
    <li className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex gap-4">
        <Link
          href={`/products/${product.slug}`}
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-teal-50 text-3xl">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            emoji
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${product.slug}`}
            className="text-base font-semibold text-slate-800 hover:text-teal-700 dark:text-slate-100">
            {product.name}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-xs text-cyan-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span className="font-medium">{seller}</span>
            <span className="text-teal-600">Verified</span>
          </p>
          {variant ? <p className="mt-1 text-xs text-slate-500">{variant.color}</p> : null}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => dispatch(decrementQuantity(lineKey))}
                  className="rounded-l-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200"
                  aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={stock}
                  value={quantity}
                  onChange={(event) =>
                    dispatch(
                      setQuantity({
                        lineKey,
                        productId,
                        variantId,
                        quantity: Number(event.target.value),
                      }),
                    )
                  }
                  className="w-12 border-x border-slate-100 bg-transparent py-2 text-center text-sm font-semibold tabular-nums outline-none dark:border-slate-700"
                  aria-label={`Quantity for ${product.name}`}
                />
                <button
                  type="button"
                  onClick={() => dispatch(incrementQuantity(lineKey))}
                  disabled={atMax}
                  className="rounded-r-xl px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-200"
                  aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => void saveForLater()}
                  className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline dark:text-teal-400">
                  <Heart className="h-3.5 w-3.5" />
                  Save for later
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(removeItem(lineKey))}
                  className="font-medium text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {formatCurrency(lineTotal)}
              </p>
              {pricing.hasDiscount && (
                <p className="text-sm text-slate-400 line-through">
                  {formatCurrency(pricing.originalPrice * quantity)}
                </p>
              )}
              {lineSavings > 0 && (
                <p className="text-xs font-medium text-teal-600">You save {formatCurrency(lineSavings)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
