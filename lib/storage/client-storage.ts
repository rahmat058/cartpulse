/** Central registry of browser storage keys used by CartPulse. */
export const StorageKeys = {
  cart: 'cartpulse-cart-v1',
  hideAnnouncementBar: 'hideAnnouncementBar',
  passwordBannerDismissed: 'cartpulse-password-banner-dismissed',
  recentlyViewed: 'cartpulse:recently-viewed',
  pendingWishlist: 'cartpulse-pending-wishlist',
  addresses: (userId: string) => `cartpulse:addresses:${userId}`,
} as const

export type StorageArea = 'local' | 'session'

function getStorage(area: StorageArea): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function getStorageItem(key: string, area: StorageArea = 'local'): string | null {
  const storage = getStorage(area)
  if (!storage) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function setStorageItem(key: string, value: string, area: StorageArea = 'local'): boolean {
  const storage = getStorage(area)
  if (!storage) return false
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStorageItem(key: string, area: StorageArea = 'local'): void {
  const storage = getStorage(area)
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function getStorageJSON<T>(key: string, fallback: T, area: StorageArea = 'local'): T {
  const raw = getStorageItem(key, area)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setStorageJSON<T>(key: string, value: T, area: StorageArea = 'local'): boolean {
  try {
    return setStorageItem(key, JSON.stringify(value), area)
  } catch {
    return false
  }
}

export function getStorageBoolean(key: string, area: StorageArea = 'local'): boolean {
  const value = getStorageItem(key, area)
  return value === 'true' || value === '1'
}

export function setStorageBoolean(key: string, value: boolean, area: StorageArea = 'local'): boolean {
  return setStorageItem(key, value ? 'true' : 'false', area)
}

/** Dismissal flags stored as `"1"`. */
export function isStorageFlagSet(key: string, area: StorageArea = 'local'): boolean {
  return getStorageItem(key, area) === '1'
}

export function setStorageFlag(key: string, area: StorageArea = 'local'): boolean {
  return setStorageItem(key, '1', area)
}

export function consumeStorageItem(key: string, area: StorageArea = 'local'): string | null {
  const value = getStorageItem(key, area)
  if (value !== null) removeStorageItem(key, area)
  return value
}

export function clearStorageByPrefix(prefix: string, area: StorageArea = 'local'): void {
  const storage = getStorage(area)
  if (!storage) return
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
    for (const key of keys) storage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Clears all known CartPulse client keys (localStorage + sessionStorage). */
export function clearKnownClientStorage(): void {
  removeStorageItem(StorageKeys.cart)
  removeStorageItem(StorageKeys.hideAnnouncementBar)
  removeStorageItem(StorageKeys.passwordBannerDismissed)
  removeStorageItem(StorageKeys.recentlyViewed)
  removeStorageItem(StorageKeys.pendingWishlist, 'session')
  clearStorageByPrefix('cartpulse', 'local')
  clearStorageByPrefix('cartpulse', 'session')
}
