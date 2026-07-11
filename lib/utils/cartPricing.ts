import type { CouponDefinition } from '@/types/commerce'
import { cartIsAllDigital } from '@/lib/utils/digital-products'
import type { CartItemsById, CartPricing, Product } from '@/lib/types/cart'
import { FREE_SHIPPING_THRESHOLD, getProductVariant, PROMO_CODES, SHIPPING_FLAT, TAX_RATE } from '@/lib/types/cart'

export function clampQuantity(quantity: number, stock: number): number {
  return Math.max(1, Math.min(quantity, stock))
}

/** Authoritative unit price for a cart line — variant override when set, else product price. */
export function resolveLineUnitPrice(product: Product, variantId?: string): number {
  const variant = getProductVariant(product, variantId)
  return variant?.price ?? product.price
}

export function getLineTotal(product: Product, quantity: number, variantId?: string): number {
  return roundCurrency(resolveLineUnitPrice(product, variantId) * quantity)
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

export interface PricingInput {
  itemsById: CartItemsById
  productsById: Record<string, Product>
  promoCode: string | null
  coupon?: CouponDefinition | null
  taxRate?: number
  shippingFlat?: number
  freeShippingThreshold?: number
}

function resolveCoupon(promoCode: string | null, coupon?: CouponDefinition | null): CouponDefinition | null {
  if (coupon) return coupon
  if (!promoCode) return null
  const fallback = PROMO_CODES[promoCode.toUpperCase()]
  if (!fallback) return null
  return {
    code: promoCode.toUpperCase(),
    type: fallback.type === 'percent' ? 'PERCENT' : fallback.type === 'shipping' ? 'SHIPPING' : 'FIXED',
    value: fallback.value,
    label: fallback.label,
  }
}

export function calculateCartPricing(input: PricingInput): CartPricing {
  const { itemsById, productsById, promoCode } = input
  const taxRate = input.taxRate ?? TAX_RATE
  const shippingFlat = input.shippingFlat ?? SHIPPING_FLAT
  const freeShippingThreshold = input.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD
  const coupon = resolveCoupon(promoCode, input.coupon)

  let subtotal = 0
  let itemCount = 0
  let uniqueCount = 0

  for (const line of Object.values(itemsById)) {
    const product = productsById[line.productId]
    if (!product) continue
    uniqueCount += 1
    itemCount += line.quantity
    subtotal += resolveLineUnitPrice(product, line.variantId) * line.quantity
  }

  subtotal = roundCurrency(subtotal)

  let discount = 0
  let discountLabel: string | null = null

  if (coupon) {
    const meetsMin = coupon.minSubtotal == null || subtotal >= coupon.minSubtotal
    if (meetsMin) {
      if (coupon.type === 'PERCENT') {
        discount = roundCurrency(subtotal * coupon.value)
        discountLabel = coupon.label
      } else if (coupon.type === 'FIXED') {
        discount = roundCurrency(Math.min(subtotal, coupon.value))
        discountLabel = coupon.label
      }
    }
  }

  const discountedSubtotal = roundCurrency(subtotal - discount)
  const tax = roundCurrency(discountedSubtotal * taxRate)

  const cartLines = Object.values(itemsById)
  const allDigital = cartIsAllDigital(cartLines, productsById)

  let shipping = subtotal > 0 && !allDigital ? shippingFlat : 0
  let shippingLabel =
    allDigital && subtotal > 0 ? 'Free — digital delivery' : shipping === 0 ? 'Free' : formatCurrency(shippingFlat)

  if (!allDigital && subtotal >= freeShippingThreshold) {
    shipping = 0
    shippingLabel = `Free — order over $${freeShippingThreshold}`
  }

  if (coupon?.type === 'SHIPPING') {
    shipping = 0
    shippingLabel = coupon.label
  }

  const total = roundCurrency(discountedSubtotal + tax + shipping)
  const amountToFreeShipping = roundCurrency(Math.max(0, freeShippingThreshold - subtotal))

  return {
    itemCount,
    uniqueCount,
    subtotal,
    discount,
    discountLabel,
    tax,
    shipping,
    shippingLabel,
    total,
    freeShippingThreshold,
    amountToFreeShipping,
    savings: discount,
  }
}

export function getCartQuantity(itemsById: CartItemsById, productId: string, variantId?: string): number {
  const lineKey = variantId ? `${productId}:${variantId}` : productId
  return itemsById[lineKey]?.quantity ?? 0
}
