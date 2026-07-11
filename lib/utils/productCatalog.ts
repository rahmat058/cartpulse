import { hasFreeDelivery } from '@/lib/utils/productDisplay'
import { SortStrategyRegistry } from '@/lib/commerce/SortStrategy'
import type { AdvancedFilters, CatalogSortBy, Product } from '@/lib/types/cart'
import { getProductStock } from '@/types/cart'

/** Human-readable label for a sort key — delegates to `SortStrategyRegistry`. */
export function getSortLabel(sortBy: CatalogSortBy): string {
  return SortStrategyRegistry.get(sortBy).label
}

/** Dropdown options derived from registered sort strategies. */
export const SORT_OPTIONS: { value: CatalogSortBy; label: string }[] = SortStrategyRegistry.all().map((strategy) => ({
  value: strategy.id,
  label: strategy.label,
}))

export function getCatalogPriceBounds(products: Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 500 }
  const prices = products.map((product) => product.price)
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  }
}

/** Client-side sort — uses the same strategy registry as server Prisma orderBy. */
export function sortProducts(products: Product[], sortBy: CatalogSortBy): Product[] {
  return SortStrategyRegistry.get(sortBy).sort(products)
}

/** Filter strategy — composable predicates for catalog sidebar filters. */
export function applyAdvancedFilters(products: Product[], filters: AdvancedFilters): Product[] {
  return products.filter((product) => {
    if (product.price < filters.priceMin || product.price > filters.priceMax) return false
    if (filters.minRating > 0 && product.rating < filters.minRating) return false
    if (filters.inStockOnly && getProductStock(product) < 1) return false
    if (filters.freeDeliveryOnly && !hasFreeDelivery(product)) return false
    return true
  })
}
