import {
  StorageKeys,
  consumeStorageItem,
  getStorageItem,
  setStorageItem,
} from '@/lib/storage/client-storage'

export function setPendingWishlistProductId(productId: string) {
  setStorageItem(StorageKeys.pendingWishlist, productId, 'session')
}

export function consumePendingWishlistProductId(): string | null {
  return consumeStorageItem(StorageKeys.pendingWishlist, 'session')
}

export function hasPendingWishlistProductId(): boolean {
  return getStorageItem(StorageKeys.pendingWishlist, 'session') !== null
}
