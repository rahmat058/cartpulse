'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { clearCart } from '@/lib/store/slices/cartSlice'
import { selectCartLines, selectLoadedProducts } from '@/lib/store/selectors/cartSelectors'
import { useCart } from '@/hooks/use-cart'
import { useCatalogLoader } from '@/hooks/useCatalogLoader'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartEmpty } from '@/components/cart/CartEmpty'
import { OrderSummaryCard } from '@/components/cart/OrderSummaryCard'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Button } from '@/components/ui/Button'

export default function CartPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { status, data: session } = useSession()
  useCart()
  useCatalogLoader()

  const lines = useAppSelector(selectCartLines)
  const catalog = useAppSelector(selectLoadedProducts)

  const recommended = useMemo(() => {
    const inCart = new Set(lines.map((line) => line.productId))
    return catalog.filter((product) => !inCart.has(product.id)).slice(0, 5)
  }, [catalog, lines])

  function handleCheckout() {
    if (status === 'unauthenticated' || !session?.user) {
      toast.message('Sign in to checkout')
      router.push('/login?callbackUrl=/checkout')
      return
    }
    router.push('/checkout')
  }

  return (
    <StorefrontContainer as="main" className="py-8">
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shopping Cart' },
        ]}
      />

      <CheckoutStepper current={1} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Your Cart ({lines.length} Item{lines.length === 1 ? '' : 's'})
        </h1>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="text-sm font-medium text-slate-400 hover:text-rose-500"
          >
            Clear all
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <CartEmpty />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <CartLineItem
                key={line.lineKey}
                lineKey={line.lineKey}
                productId={line.productId}
                variantId={line.variantId}
                quantity={line.quantity}
                product={line.product}
                variant={line.variant}
              />
            ))}
          </ul>

          <OrderSummaryCard
            ctaLabel="Proceed to Checkout"
            onCheckout={handleCheckout}
            footerNote="Secure checkout · Stripe or Cash on Delivery"
          />
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Recommended for you
            </h2>
            <Link href="/products" className="text-sm font-medium text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {recommended.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                layout="catalog-grid"
                linkToDetail
              />
            ))}
          </div>
        </section>
      )}

      {lines.length > 0 && (
        <div className="mt-8">
          <Link href="/products">
            <Button variant="outline">Continue shopping</Button>
          </Link>
        </div>
      )}
    </StorefrontContainer>
  )
}
