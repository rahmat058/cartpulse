import type { Product } from '@/lib/types/cart'
import { getProductStock } from '@/types/cart'
import { ProductPricing } from '@/lib/commerce/ProductPricing'

const SELLERS = ['CartPulse Official', 'Tech Hub', 'Home & Living', 'Style Co'] as const

export function getProductSeller(product: Product): string {
  if (product.storeSlug) {
    return product.storeSlug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  const index = parseInt(product.id.replace(/\D/g, ''), 10) % SELLERS.length
  return SELLERS[index]!
}

export function getProductPromo(product: Product) {
  const pricing = ProductPricing.for(product)
  return {
    discountPercent: pricing.discountPercent,
    originalPrice: pricing.originalPrice,
  }
}

export function hasFreeDelivery(product: Product): boolean {
  return product.price >= 50
}

export function isNewProduct(product: Product): boolean {
  return product.rating >= 4.7
}

export function getDeliveryEta(product: Product): string {
  if (product.isDigital) return 'Instant download'
  return getProductStock(product) > 0 ? 'In 2-3 days' : 'Unavailable'
}

export function isSoldOut(product: Product): boolean {
  if (product.isDigital) return false
  return getProductStock(product) < 1
}
