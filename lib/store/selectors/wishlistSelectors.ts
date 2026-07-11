'use client'

import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/lib/store/types'
import type { Product } from '@/types/cart'

export const selectWishlistProductIds = (state: RootState) => state.wishlist.productIds
export const selectWishlistCount = (state: RootState) => state.wishlist.productIds.length
export const selectWishlistHydrated = (state: RootState) => state.wishlist.hydrated

export const selectIsWishlisted = (productId: string) => (state: RootState) =>
  state.wishlist.productIds.includes(productId)

export const selectWishlistProducts = createSelector(
  [
    selectWishlistProductIds,
    (state: RootState) => state.wishlist.productsById,
    (state: RootState) => state.cart.productsById,
  ],
  (productIds, wishlistProducts, cartProducts): Product[] =>
    productIds
      .map((id) => wishlistProducts[id] ?? cartProducts[id])
      .filter((product): product is Product => Boolean(product)),
)
