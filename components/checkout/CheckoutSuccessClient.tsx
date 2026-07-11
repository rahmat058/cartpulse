'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/lib/store/hooks'
import { clearCart } from '@/lib/store/slices/cartSlice'

/**
 * Clears the Redux cart after a successful payment redirect from Stripe Checkout.
 */
export function CheckoutSuccessClient({
  shouldClearCart,
}: {
  shouldClearCart: boolean
}) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (shouldClearCart) {
      dispatch(clearCart())
    }
  }, [dispatch, shouldClearCart])

  return null
}
