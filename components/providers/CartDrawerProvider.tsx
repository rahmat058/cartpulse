'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface CartDrawerContextValue {
  open: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null)

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openCart = useCallback(() => setOpen(true), [])
  const closeCart = useCallback(() => setOpen(false), [])
  const toggleCart = useCallback(() => setOpen((value) => !value), [])

  const value = useMemo(
    () => ({ open, openCart, closeCart, toggleCart }),
    [open, openCart, closeCart, toggleCart],
  )

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer open={open} onClose={closeCart} />
    </CartDrawerContext.Provider>
  )
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext)
  if (!context) {
    throw new Error('useCartDrawer must be used within CartDrawerProvider')
  }
  return context
}
