'use client'

import { useCart } from '@/hooks/use-cart'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { FloatingCartButton } from '@/components/cart/FloatingCartButton'
import { CartDrawerProvider, useCartDrawer } from '@/components/providers/CartDrawerProvider'

function CartPersistence() {
  useCart()
  return null
}

function FloatingCart() {
  const { openCart } = useCartDrawer()
  return <FloatingCartButton onClick={openCart} />
}

export function StorefrontShell({
  children,
  showFloatingCart = true,
}: {
  children: React.ReactNode
  showFloatingCart?: boolean
}) {
  return (
    <CartDrawerProvider>
      <CartPersistence />
      <Header />
      <ErrorBoundary title="This page failed to load">{children}</ErrorBoundary>
      <Footer />
      {showFloatingCart ? <FloatingCart /> : null}
    </CartDrawerProvider>
  )
}
