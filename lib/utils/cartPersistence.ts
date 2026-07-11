import type { CartItemsById } from '@/lib/types/cart'
import type { CouponDefinition } from '@/types/commerce'
import {
  StorageKeys,
  getStorageJSON,
  removeStorageItem,
  setStorageJSON,
} from '@/lib/storage/client-storage'

export interface PersistedCart {
  itemsById: CartItemsById
  promoCode: string | null
  appliedCoupon?: CouponDefinition | null
  savedAt: string
}

export function loadPersistedCart(): PersistedCart | null {
  const parsed = getStorageJSON<PersistedCart | null>(StorageKeys.cart, null)
  if (!parsed?.itemsById || typeof parsed.itemsById !== 'object') return null
  return parsed
}

export function savePersistedCart(
  itemsById: CartItemsById,
  promoCode: string | null,
  appliedCoupon: CouponDefinition | null = null,
) {
  const payload: PersistedCart = {
    itemsById,
    promoCode,
    appliedCoupon,
    savedAt: new Date().toISOString(),
  }
  setStorageJSON(StorageKeys.cart, payload)
}

export function clearPersistedCart() {
  removeStorageItem(StorageKeys.cart)
}
