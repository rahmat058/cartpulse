import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils/cartPricing'

export type OrderDisplayData = {
  id: string
  status: string
  paymentMethod: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  createdAt: Date
  shippingName: string | null
  shippingPhone: string | null
  shippingLine1: string | null
  shippingLine2: string | null
  shippingCity: string | null
  shippingCountry: string | null
  deliveryNote: string | null
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    product: {
      name: string
      emoji: string
      imageUrl: string | null
      imageUrls: string[]
    }
    variant: { color: string; hex: string } | null
  }>
}

type PrismaOrder = NonNullable<Awaited<ReturnType<typeof import('@/lib/services/orders').getOrderById>>>

export function toOrderDisplayData(order: PrismaOrder): OrderDisplayData {
  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    createdAt: order.createdAt,
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingCountry: order.shippingCountry,
    deliveryNote: order.deliveryNote,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: {
        name: item.product.name,
        emoji: item.product.emoji,
        imageUrl: item.product.imageUrl,
        imageUrls: item.product.imageUrls ?? [],
      },
      variant: item.variant ? { color: item.variant.color, hex: item.variant.hex } : null,
    })),
  }
}

export function formatPaymentMethod(method: string) {
  if (method === 'STRIPE') return 'Card (Stripe)'
  if (method === 'COD') return 'Cash on delivery'
  return method
}

export function formatShippingAddress(order: OrderDisplayData): string | null {
  const lines = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingCountry].filter(Boolean).join(', '),
  ].filter(Boolean)

  if (lines.length === 0 && !order.shippingName && !order.shippingPhone) return null

  return [order.shippingName, ...lines, order.shippingPhone].filter(Boolean).join('\n')
}

export function formatOrderPlacedAt(date: Date) {
  return format(date, 'MMM d, yyyy · h:mm aa')
}

export function formatOrderLabel(orderId: string) {
  return `Order#${orderId}`
}

export function orderStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'muted' | 'teal' | 'info' {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'PAID':
      return 'teal'
    case 'SHIPPED':
      return 'info'
    case 'PENDING':
      return 'warning'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'muted'
  }
}

export function formatOrderMoney(amount: number) {
  return formatCurrency(amount)
}

export const FULFILLMENT_STEPS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'] as const

export type FulfillmentStep = (typeof FULFILLMENT_STEPS)[number]

export const FULFILLMENT_STEP_COLORS: Record<
  FulfillmentStep,
  {
    complete: string
    current: string
    line: string
    label: string
  }
> = {
  PENDING: {
    complete: 'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500',
    current:
      'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/25 dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20',
    line: 'bg-amber-400 dark:bg-amber-600',
    label: 'text-amber-700 dark:text-amber-300',
  },
  PAID: {
    complete: 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500',
    current:
      'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/25 dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-400/20',
    line: 'bg-teal-500 dark:bg-teal-600',
    label: 'text-teal-700 dark:text-teal-300',
  },
  SHIPPED: {
    complete: 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500',
    current:
      'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-600/25 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-400/20',
    line: 'bg-sky-500 dark:bg-sky-600',
    label: 'text-sky-700 dark:text-sky-300',
  },
  DELIVERED: {
    complete: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500',
    current:
      'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/25 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-400/20',
    line: 'bg-emerald-500 dark:bg-emerald-600',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
}

export function formatFulfillmentStepLabel(step: string) {
  switch (step) {
    case 'PENDING':
      return 'Pending'
    case 'PAID':
      return 'Paid'
    case 'SHIPPED':
      return 'Shipped'
    case 'DELIVERED':
      return 'Delivered'
    default:
      return step
  }
}

export function fulfillmentStepIndex(status: string) {
  if (status === 'CANCELLED') return -1
  return FULFILLMENT_STEPS.indexOf(status as (typeof FULFILLMENT_STEPS)[number])
}
