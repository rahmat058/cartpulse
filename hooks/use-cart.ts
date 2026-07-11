'use client'

import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { hydrateCart, upsertProducts } from '@/lib/store/slices/cartSlice'
import { selectCartPricing, selectCartLines } from '@/lib/store/selectors/cartSelectors'
import { loadPersistedCart, savePersistedCart } from '@/lib/utils/cartPersistence'
import type { Product } from '@/types/cart'

/** Shared across every useCart() call so we only hydrate / start persisting once. */
let cartHydrationStarted = false
let cartPersistEnabled = false
let lastMissingFetchKey = ''

export function useCart() {
  const dispatch = useAppDispatch()
  const itemsById = useAppSelector((state) => state.cart.itemsById)
  const promoCode = useAppSelector((state) => state.cart.promoCode)
  const appliedCoupon = useAppSelector((state) => state.cart.appliedCoupon)
  const productsById = useAppSelector((state) => state.cart.productsById)
  const restoredFromStorage = useAppSelector((state) => state.cart.restoredFromStorage)
  const lines = useAppSelector(selectCartLines)
  const pricing = useAppSelector(selectCartPricing)

  const missingIdsKey = useMemo(() => {
    const ids = [
      ...new Set(
        Object.values(itemsById)
          .map((line) => line.productId)
          .filter((id) => !productsById[id]),
      ),
    ].sort()
    return ids.join(',')
  }, [itemsById, productsById])

  // Restore cart lines from localStorage once on the client (SSR-safe).
  useEffect(() => {
    if (cartHydrationStarted) return
    cartHydrationStarted = true

    const saved = loadPersistedCart()
    dispatch(
      hydrateCart({
        itemsById: saved?.itemsById ?? {},
        promoCode: saved?.promoCode ?? null,
        appliedCoupon: saved?.appliedCoupon ?? null,
      }),
    )
    cartPersistEnabled = true
  }, [dispatch])

  // Fetch product payloads for cart line IDs missing from the catalog cache.
  useEffect(() => {
    if (!restoredFromStorage || !missingIdsKey) return
    if (missingIdsKey === lastMissingFetchKey) return
    lastMissingFetchKey = missingIdsKey

    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(`/api/products?ids=${missingIdsKey}`)
        if (!response.ok || cancelled) return
        const json = (await response.json()) as { data: Product[] }
        if (!cancelled && json.data?.length) {
          dispatch(upsertProducts(json.data))
        }
      } catch {
        // Keep cart lines; products will resolve when catalog loads.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [dispatch, missingIdsKey, restoredFromStorage])

  // Persist after hydration so we never overwrite storage with empty SSR state.
  useEffect(() => {
    if (!cartPersistEnabled || !restoredFromStorage) return
    savePersistedCart(itemsById, promoCode, appliedCoupon)
  }, [appliedCoupon, itemsById, promoCode, restoredFromStorage])

  return {
    dispatch,
    itemsById,
    promoCode,
    lines,
    pricing,
    itemCount: pricing.itemCount,
    total: pricing.total,
  }
}
