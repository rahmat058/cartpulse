import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/lib/store/types'
import type { Product } from '@/lib/types/cart'
import { getCartLineKey, getProductVariant } from '@/lib/types/cart'
import { calculateCartPricing } from '@/lib/utils/cartPricing'
import { SortStrategyRegistry } from '@/lib/commerce/SortStrategy'
import { applyAdvancedFilters } from '@/lib/utils/productCatalog'

export const selectProductsById = (state: RootState) => state.cart.productsById
export const selectCatalogResultIds = (state: RootState) => state.cart.catalogResultIds
export const selectCatalogTotal = (state: RootState) => state.cart.catalogTotal
export const selectItemsById = (state: RootState) => state.cart.itemsById
export const selectPromoCode = (state: RootState) => state.cart.promoCode
export const selectAppliedCoupon = (state: RootState) => state.cart.appliedCoupon
export const selectCategoryFilter = (state: RootState) => state.cart.categoryFilter
export const selectAdvancedFilters = (state: RootState) => state.cart.advancedFilters
export const selectCatalogStatus = (state: RootState) => state.cart.catalogStatus
export const selectCatalogError = (state: RootState) => state.cart.catalogError

export const selectCatalogProducts = createSelector([selectCatalogResultIds, selectProductsById], (ids, productsById) =>
  ids.map((id) => productsById[id]).filter((product): product is Product => Boolean(product)),
)

export const selectCartPricing = createSelector(
  [selectItemsById, selectProductsById, selectPromoCode, selectAppliedCoupon],
  (itemsById, productsById, promoCode, appliedCoupon) =>
    calculateCartPricing({ itemsById, productsById, promoCode, coupon: appliedCoupon }),
)

export const selectCartLines = createSelector([selectItemsById, selectProductsById], (itemsById, productsById) =>
  Object.entries(itemsById)
    .map(([lineKey, line]) => {
      const product = productsById[line.productId]
      if (!product) return null
      const variant = getProductVariant(product, line.variantId)
      return { lineKey, ...line, product, variant }
    })
    .filter((line): line is NonNullable<typeof line> => line !== null),
)

export const selectFilteredProducts = createSelector(
  [selectProductsById, selectCategoryFilter],
  (productsById, categoryFilter) => {
    const products = Object.values(productsById)
    if (categoryFilter === 'all') return products
    return products.filter((product) => product.category === categoryFilter)
  },
)

export const selectAdvancedFilteredProducts = createSelector(
  [selectFilteredProducts, selectAdvancedFilters],
  (products, filters) => {
    const filtered = applyAdvancedFilters(products, filters)
    return SortStrategyRegistry.get(filters.sortBy).sort(filtered)
  },
)

export const selectProductById = (productId: string) => (state: RootState) => state.cart.productsById[productId]

export const selectProductBySlug = (slug: string) => (state: RootState) =>
  Object.values(state.cart.productsById).find((product) => product.slug === slug)

export const selectLoadedProducts = createSelector([selectProductsById], (productsById) => Object.values(productsById))

export const selectProductTotalQuantity = (productId: string) => (state: RootState) =>
  Object.values(state.cart.itemsById)
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.quantity, 0)

export const selectVariantQuantity = (productId: string, variantId?: string) => (state: RootState) => {
  const lineKey = getCartLineKey(productId, variantId)
  return state.cart.itemsById[lineKey]?.quantity ?? 0
}

export const selectIsInCart = (productId: string) => (state: RootState) =>
  Object.values(state.cart.itemsById).some((line) => line.productId === productId)

export const selectCartItemCount = (state: RootState) => selectCartPricing(state).itemCount

export function sortProductsByName(products: Product[]): Product[] {
  return SortStrategyRegistry.get('name-asc').sort(products)
}

export const selectSortedFilteredProducts = createSelector([selectFilteredProducts], (products) =>
  sortProductsByName(products),
)

export const selectCategoryCounts = createSelector([selectProductsById], (productsById) => {
  const counts: Record<string, number> = {
    all: Object.keys(productsById).length,
  }

  for (const product of Object.values(productsById)) {
    counts[product.category] = (counts[product.category] ?? 0) + 1
  }

  return counts
})

export const selectCatalogPriceBounds = (state: RootState) => state.cart.catalogPriceBounds

export const selectAdvancedFilterResultCount = createSelector([selectCatalogProducts], (products) => products.length)
