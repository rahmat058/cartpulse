'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
  addToWishlist,
  hydrateWishlist,
  toggleWishlist,
} from '@/lib/store/slices/wishlistSlice'
import {
  selectIsWishlisted,
  selectWishlistCount,
  selectWishlistHydrated,
} from '@/lib/store/selectors/wishlistSelectors'
import {
  consumePendingWishlistProductId,
  setPendingWishlistProductId,
} from '@/lib/wishlist-pending'
import type { Product } from '@/types/cart'

/** Avoid re-hydrating from every ProductCard/Header mount. */
let lastWishlistAuthKey: string | null = null

function wishlistErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : fallback
}

export function useWishlist(productId?: string) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const count = useAppSelector(selectWishlistCount)
  const hydrated = useAppSelector(selectWishlistHydrated)
  const wished = useAppSelector(productId ? selectIsWishlisted(productId) : () => false)
  const authenticated = status === 'authenticated' && Boolean(session?.user?.id)
  const pendingHandled = useRef(false)

  useEffect(() => {
    if (status === 'loading') return
    const authKey = authenticated ? `auth:${session?.user?.id}` : 'guest'
    if (lastWishlistAuthKey === authKey) return
    lastWishlistAuthKey = authKey
    pendingHandled.current = false
    void dispatch(hydrateWishlist(authenticated))
  }, [dispatch, status, authenticated, session?.user?.id])

  useEffect(() => {
    if (!authenticated || !hydrated || pendingHandled.current) return

    const pendingId = consumePendingWishlistProductId()
    if (!pendingId) return

    pendingHandled.current = true
    void (async () => {
      try {
        await dispatch(addToWishlist({ productId: pendingId })).unwrap()
        toast.success('Added to wishlist')
      } catch (error) {
        toast.error(wishlistErrorMessage(error, 'Failed to add to wishlist'))
      }
    })()
  }, [authenticated, dispatch, hydrated])

  const toggle = useCallback(
    async (id: string, product?: Product) => {
      if (!authenticated) {
        if (wished) return false
        setPendingWishlistProductId(id)
        const callbackUrl = encodeURIComponent(pathname || '/')
        router.push(`/login?callbackUrl=${callbackUrl}`)
        toast.message('Sign in to save items to your wishlist')
        return null
      }

      try {
        const result = await dispatch(toggleWishlist({ productId: id, product })).unwrap()
        toast.success(result.wished ? 'Added to wishlist' : 'Removed from wishlist')
        return result.wished
      } catch (error) {
        toast.error(wishlistErrorMessage(error, 'Wishlist update failed'))
        return null
      }
    },
    [authenticated, dispatch, pathname, router, wished],
  )

  return { count, hydrated, wished, toggle, authenticated }
}
