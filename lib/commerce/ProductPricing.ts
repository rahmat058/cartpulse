import type { Product } from '@/types/cart'
import { roundCurrency } from '@/lib/utils/cartPricing'

/** Strategy: how list/PDP prices are derived from catalog data */
export interface PricingStrategy {
  getSalePrice(product: Product): number
  getOriginalPrice(product: Product): number
  getDiscountPercent(product: Product): number
}

/** Deterministic promo from product id (demo marketplace pricing) */
export class SyntheticPromoStrategy implements PricingStrategy {
  getDiscountPercent(product: Product): number {
    const seed = parseInt(product.id.replace(/\D/g, ''), 10)
    return 10 + (seed % 4) * 10
  }

  getOriginalPrice(product: Product): number {
    const discount = this.getDiscountPercent(product)
    return roundCurrency(product.price / (1 - discount / 100))
  }

  getSalePrice(product: Product): number {
    return product.price
  }
}

/** Facade — single entry for UI components */
export class ProductPricing {
  private static strategy: PricingStrategy = new SyntheticPromoStrategy()

  static setStrategy(strategy: PricingStrategy) {
    ProductPricing.strategy = strategy
  }

  static for(product: Product) {
    const strategy = ProductPricing.strategy
    const discountPercent = strategy.getDiscountPercent(product)
    const salePrice = strategy.getSalePrice(product)
    const originalPrice = strategy.getOriginalPrice(product)
    const savings = roundCurrency(originalPrice - salePrice)

    return {
      discountPercent,
      salePrice,
      originalPrice,
      savings,
      hasDiscount: discountPercent > 0,
      formattedSale: salePrice,
      formattedOriginal: originalPrice,
    }
  }
}
