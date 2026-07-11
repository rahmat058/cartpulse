import type { CouponDefinition } from '@/types/commerce'

export type ProductCategory = string

export type CatalogSortBy =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'newest'

export type CatalogViewMode = 'grid' | 'list'

export type ProductVariantType = 'COLOR' | 'SIZE'

export interface ProductVariant {
  id: string
  sku: string
  slug: string
  color: string
  hex: string
  stock: number
  price?: number
  emoji?: string
  isDefault?: boolean
}

export interface StoreInfo {
  id?: string
  slug: string
  name: string
  description?: string
  supportEmail?: string
  logoEmoji?: string
  logoUrl?: string
  currency: string
  taxRate?: number
  shippingFlat?: number
  freeShippingThreshold?: number
  verified?: boolean
}

export interface Product {
  id: string
  slug: string
  storeId?: string
  storeSlug?: string
  name: string
  category: string
  price: number
  stock: number
  rating: number
  emoji: string
  imageUrl?: string
  imageUrls?: string[]
  description: string
  published?: boolean
  isDigital?: boolean
  digitalAssetUrl?: string | null
  variantType?: ProductVariantType
  variants?: ProductVariant[]
  defaultVariantId?: string
}

export interface ProductsMeta {
  schemaVersion: string
  collection: string
  totalProducts: number
  categories: string[]
  currency: string
  generatedAt: string
  store?: StoreInfo
}

export interface ProductsResponse {
  meta: ProductsMeta
  data: Product[]
}

export interface CatalogQueryParams {
  category?: ProductCategory
  priceMin?: number
  priceMax?: number
  minRating?: number
  inStockOnly?: boolean
  freeDeliveryOnly?: boolean
  sortBy?: CatalogSortBy
  search?: string
  storeSlug?: string
}

export interface CartLineItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface CartItemsById {
  [lineKey: string]: CartLineItem
}

export type CatalogStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface AdvancedFilters {
  priceMin: number
  priceMax: number
  minRating: number
  inStockOnly: boolean
  freeDeliveryOnly: boolean
  sortBy: CatalogSortBy
  viewMode: CatalogViewMode
}

export interface CartState {
  productsById: Record<string, Product>
  /** Ordered IDs from the latest catalog API response (filtered). */
  catalogResultIds: string[]
  catalogTotal: number
  /** Full-catalog price slider bounds (expanded as products load). */
  catalogPriceBounds: { min: number; max: number }
  catalogPriceBoundsReady: boolean
  meta: ProductsMeta | null
  itemsById: CartItemsById
  promoCode: string | null
  appliedCoupon: CouponDefinition | null
  categoryFilter: ProductCategory
  advancedFilters: AdvancedFilters
  catalogStatus: CatalogStatus
  catalogError: string | null
  restoredFromStorage: boolean
}

export interface CartPricing {
  itemCount: number
  uniqueCount: number
  subtotal: number
  discount: number
  discountLabel: string | null
  tax: number
  shipping: number
  shippingLabel: string
  total: number
  freeShippingThreshold: number
  amountToFreeShipping: number
  savings?: number
}

/** Fallback demo codes when DB coupons aren't loaded yet */
export const PROMO_CODES: Record<
  string,
  { type: 'percent' | 'shipping' | 'fixed'; value: number; label: string }
> = {
  SAVE10: { type: 'percent', value: 0.1, label: '10% off' },
  FREESHIP: { type: 'shipping', value: 0, label: 'Free shipping' },
  CARTPULSE15: { type: 'percent', value: 0.15, label: '15% off' },
}

export const TAX_RATE = 0.08
export const SHIPPING_FLAT = 5.99
export const FREE_SHIPPING_THRESHOLD = 75

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  priceMin: 0,
  priceMax: 500,
  minRating: 0,
  inStockOnly: false,
  freeDeliveryOnly: false,
  sortBy: 'name-asc',
  viewMode: 'grid',
}

export function getCartLineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

export function getProductVariant(product: Product, variantId?: string): ProductVariant | undefined {
  if (!variantId || !product.variants) return undefined
  return product.variants.find((variant) => variant.id === variantId)
}

export function hasProductVariants(product: Pick<Product, 'variants'>): boolean {
  return (product.variants?.length ?? 0) > 0
}

export function getInStockVariants(product: Product): ProductVariant[] {
  if (!product.variants?.length) return []
  return product.variants.filter((variant) => variant.stock > 0)
}

/** Total sellable units — sum of variant stock when variants exist, otherwise product.stock. */
export function resolveProductStock(product: Pick<Product, 'stock' | 'variants'>): number {
  if (product.variants?.length) {
    return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
  }
  return product.stock
}

export function getProductStock(product: Product, variantId?: string): number {
  if (product.isDigital) return 9999
  const variant = getProductVariant(product, variantId)
  if (variant) return variant.stock
  return resolveProductStock(product)
}

export function getProductDisplayEmoji(product: Product, variantId?: string): string {
  const variant = getProductVariant(product, variantId)
  return variant?.emoji ?? product.emoji
}

export function getDefaultVariantId(product: Product): string | undefined {
  if (!product.variants?.length) return undefined

  const inStock = getInStockVariants(product)
  if (inStock.length > 0) {
    const preferred =
      (product.defaultVariantId ? inStock.find((variant) => variant.id === product.defaultVariantId) : undefined) ??
      inStock.find((variant) => variant.isDefault) ??
      inStock[0]
    return preferred?.id
  }

  const defaultVariant = product.variants.find((variant) => variant.isDefault)
  return product.defaultVariantId ?? defaultVariant?.id ?? product.variants[0]?.id
}
