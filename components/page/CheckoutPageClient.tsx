'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, Download, MapPin, Package, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
  selectCartLines,
  selectCartPricing,
  selectItemsById,
  selectPromoCode,
} from '@/lib/store/selectors/cartSelectors'
import { clearCart } from '@/lib/store/slices/cartSlice'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { StorefrontContainer } from '@/components/layout/StorefrontContainer'
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { OrderSummaryCard } from '@/components/cart/OrderSummaryCard'
import { CartEmpty } from '@/components/cart/CartEmpty'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'
import {
  addressSchema,
  EMPTY_ADDRESS,
  type AddressFormValues,
} from '@/lib/validations/account'
import {
  readUserAddresses,
  toAddressFormValues,
  type SavedAddress,
} from '@/lib/addresses/client-addresses'
import { cartHasDigitalProduct, cartIsAllDigital } from '@/lib/utils/digital-products'

export function CheckoutPageClient() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session } = useSession()
  useCart()

  const lines = useAppSelector(selectCartLines)
  const itemsById = useAppSelector(selectItemsById)
  const promoCode = useAppSelector(selectPromoCode)
  const pricing = useAppSelector(selectCartPricing)

  const hasDigital = useMemo(
    () => cartHasDigitalProduct(lines, Object.fromEntries(lines.map((line) => [line.productId, line.product]))),
    [lines],
  )
  const allDigital = useMemo(
    () => cartIsAllDigital(lines, Object.fromEntries(lines.map((line) => [line.productId, line.product]))),
    [lines],
  )

  const [dashboardAddresses, setDashboardAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [savedAddress, setSavedAddress] = useState<AddressFormValues | null>(null)
  const [showNewForm, setShowNewForm] = useState(true)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'STRIPE'>('STRIPE')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: savingAddress },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS,
  })

  const hasAddress = Boolean(savedAddress)
  const userId = session?.user?.id

  useEffect(() => {
    if (hasDigital && paymentMethod === 'COD') {
      setPaymentMethod('STRIPE')
    }
  }, [hasDigital, paymentMethod])

  useEffect(() => {
    if (!userId) {
      setDashboardAddresses([])
      setSelectedAddressId(null)
      setSavedAddress(null)
      setShowNewForm(true)
      reset(EMPTY_ADDRESS)
      return
    }

    const addresses = readUserAddresses(userId)
    setDashboardAddresses(addresses)

    if (addresses.length > 0) {
      const first = addresses[0]
      setSelectedAddressId(first.id)
      setSavedAddress(toAddressFormValues(first))
      setShowNewForm(false)
      reset(toAddressFormValues(first))
    } else {
      setSelectedAddressId(null)
      setSavedAddress(null)
      setShowNewForm(true)
      reset(EMPTY_ADDRESS)
    }
  }, [userId, reset])

  function selectDashboardAddress(address: SavedAddress) {
    setSelectedAddressId(address.id)
    setSavedAddress(toAddressFormValues(address))
    setShowNewForm(false)
    setFormError(null)
    reset(toAddressFormValues(address))
  }

  function openNewAddressForm() {
    setSelectedAddressId(null)
    setSavedAddress(null)
    setShowNewForm(true)
    reset(EMPTY_ADDRESS)
    setFormError(null)
  }

  function cancelNewAddressForm() {
    if (dashboardAddresses.length === 0) return
    const fallback = dashboardAddresses.find((item) => item.id === selectedAddressId) ?? dashboardAddresses[0]
    selectDashboardAddress(fallback)
  }

  function onSaveAddress(values: AddressFormValues) {
    setSavedAddress(values)
    setSelectedAddressId(null)
    setShowNewForm(false)
    setFormError(null)
    toast.success('Delivery address saved')
  }

  async function placeOrder() {
    if (lines.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    if (!savedAddress) {
      setFormError('Please add a delivery address first.')
      toast.error('Please add a delivery address first.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsById,
          promoCode,
          paymentMethod,
          deliveryNote: deliveryNote.trim() || null,
          shippingAddress: {
            fullName: savedAddress.fullName.trim(),
            phone: savedAddress.phone.trim(),
            line1: savedAddress.line1.trim(),
            line2: savedAddress.line2?.trim() || null,
            city: savedAddress.city.trim(),
            country: savedAddress.country.trim(),
          },
        }),
      })

      const json = (await response.json()) as {
        url?: string
        error?: string
        demo?: boolean
        orderId?: string
        paymentMethod?: 'COD' | 'STRIPE'
      }

      if (!response.ok) {
        toast.error(json.error ?? 'Checkout failed')
        return
      }

      if (!json.url) {
        toast.error('Checkout did not return a redirect URL')
        return
      }

      // Stripe hosted Checkout requires a full-page redirect (external URL).
      if (json.paymentMethod === 'STRIPE' && json.url.startsWith('http')) {
        toast.success('Redirecting to secure payment…')
        window.location.assign(json.url)
        return
      }

      dispatch(clearCart())
      toast.success('Order placed')
      router.push(json.url)
    } catch {
      toast.error('Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <StorefrontContainer as="main" className="py-10">
        <CheckoutStepper current={2} />
        <div className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CartEmpty variant="panel" />
        </div>
      </StorefrontContainer>
    )
  }

  return (
    <StorefrontContainer as="main" className="py-8">
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      <CheckoutStepper current={2} />

      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <section className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Delivery address
              </h2>
            </div>

            {!showNewForm && dashboardAddresses.length > 0 && selectedAddressId ? (
              <div className="space-y-3">
                <ul className="space-y-2">
                  {dashboardAddresses.map((address) => {
                    const selected = selectedAddressId === address.id
                    return (
                      <li key={address.id}>
                        <button
                          type="button"
                          onClick={() => selectDashboardAddress(address)}
                          className={cn(
                            'w-full rounded-md border p-4 text-left transition-colors',
                            selected
                              ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30'
                              : 'border-slate-200 bg-slate-50 hover:border-teal-200 dark:border-slate-800 dark:bg-slate-900',
                          )}
                        >
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {address.fullName}
                          </p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {address.phone}
                          </p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {address.line1}
                            {address.line2 ? `, ${address.line2}` : ''}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {address.city}, {address.country}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <button
                  type="button"
                  onClick={openNewAddressForm}
                  className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                >
                  + Add new address
                </button>
              </div>
            ) : showNewForm ? (
              <form onSubmit={handleSubmit(onSaveAddress)} className="space-y-3" noValidate>
                {dashboardAddresses.length === 0 && (
                  <p className="text-sm font-semibold text-teal-700">+ Add new address</p>
                )}
                {dashboardAddresses.length > 0 && (
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">New address</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Fullname</label>
                    <Input
                      {...register('fullName')}
                      placeholder="Your full name"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName ? (
                      <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Phone</label>
                    <Input
                      {...register('phone')}
                      placeholder="+1 555 000 0000"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone ? (
                      <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Address line 1
                    </label>
                    <Input
                      {...register('line1')}
                      placeholder="Street address"
                      aria-invalid={Boolean(errors.line1)}
                    />
                    {errors.line1 ? (
                      <p className="mt-1 text-xs text-rose-600">{errors.line1.message}</p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Address line 2 (optional)
                    </label>
                    <Input {...register('line2')} placeholder="Apartment, suite, etc." />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">City/area</label>
                    <Input
                      {...register('city')}
                      placeholder="City"
                      aria-invalid={Boolean(errors.city)}
                    />
                    {errors.city ? (
                      <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
                    <Input {...register('country')} aria-invalid={Boolean(errors.country)} />
                    {errors.country ? (
                      <p className="mt-1 text-xs text-rose-600">{errors.country.message}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" loading={savingAddress}>
                    Save
                  </Button>
                  {dashboardAddresses.length > 0 && (
                    <Button type="button" variant="outline" onClick={cancelNewAddressForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            ) : savedAddress ? (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{savedAddress.fullName}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{savedAddress.phone}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {savedAddress.line1}
                  {savedAddress.line2 ? `, ${savedAddress.line2}` : ''}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {savedAddress.city}, {savedAddress.country}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-teal-700 hover:underline"
                  onClick={() => {
                    if (dashboardAddresses.length > 0) {
                      selectDashboardAddress(dashboardAddresses[0])
                    } else {
                      openNewAddressForm()
                    }
                  }}
                >
                  Use a different address
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Note for delivery agent (optional)
              </h2>
            </div>
            <textarea
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              rows={3}
              placeholder="e.g. Call on arrival, leave with security, etc."
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900"
            />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Review items</h2>
            </div>
            <ul>
              {lines.map((line) => (
                <CartLineItem
                  key={line.lineKey}
                  lineKey={line.lineKey}
                  productId={line.productId}
                  variantId={line.variantId}
                  quantity={line.quantity}
                  product={line.product}
                  variant={line.variant}
                  compact
                />
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Payment method
            </h3>
            <div className="space-y-2">
              {!hasDigital ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
                    paymentMethod === 'COD'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                      : 'border-slate-200 hover:border-teal-200 dark:border-slate-700',
                  )}
                >
                  <Banknote className="mt-0.5 h-5 w-5 text-teal-700" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Cash on Delivery
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Pay {formatCurrency(pricing.total)} when your order arrives. No online payment
                      required.
                    </span>
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE')}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
                  paymentMethod === 'STRIPE'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                    : 'border-slate-200 hover:border-teal-200 dark:border-slate-700',
                )}
              >
                <Banknote className="mt-0.5 h-5 w-5 text-slate-500" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Card / Stripe
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {hasDigital
                      ? 'Required for digital delivery. Access appears in your Library after payment.'
                      : 'Pay securely online before delivery.'}
                  </span>
                </span>
              </button>
            </div>
            {hasDigital ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400">
                <Download className="h-3.5 w-3.5" />
                {allDigital
                  ? 'All items are digital — no shipping fee. Downloads unlock in your Library once paid.'
                  : 'This order includes digital items. They unlock in your Library after payment.'}
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Truck className="h-3.5 w-3.5" />
                Expected in 2–4 days
              </p>
            )}
          </div>

          {!hasAddress && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Please add a delivery address first.
            </div>
          )}
          {formError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {formError}
            </div>
          )}

          <OrderSummaryCard
            showPromo={false}
            ctaLabel={
              paymentMethod === 'COD'
                ? `Place Order · ${formatCurrency(pricing.total)}`
                : `Pay · ${formatCurrency(pricing.total)}`
            }
            paymentLabel={paymentMethod === 'COD' ? 'Cash on Delivery' : 'Total'}
            onCheckout={placeOrder}
            loading={submitting}
            disabled={!hasAddress}
            footerNote={
              paymentMethod === 'COD'
                ? 'Pay cash only after you receive your order.'
                : 'You will be redirected to Stripe Checkout.'
            }
          />
        </div>
      </div>
    </StorefrontContainer>
  )
}
