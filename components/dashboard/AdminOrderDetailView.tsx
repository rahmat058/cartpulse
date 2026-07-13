'use client'

import Link from 'next/link'
import {
  AdminOrderDetailHeaderLive,
  AdminOrderStatusActionsLive,
  AdminOrderStatusProvider,
  AdminOrderStatusStepperLive,
} from '@/components/dashboard/AdminOrderStatusProvider'
import { formatOrderPlacedAt } from '@/lib/orders/order-display'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/app/generated/prisma/client'
import { ArrowLeft, CreditCard, Mail, MapPin, Package, User } from 'lucide-react'

export type AdminOrderDetail = {
  id: string
  status: OrderStatus
  createdAt: string | Date
  total: number
  subtotal: number
  discount: number
  tax: number
  shipping: number
  paymentMethod: string
  stripeSessionId: string | null
  shippingName: string | null
  shippingPhone: string | null
  shippingLine1: string | null
  shippingLine2: string | null
  shippingCity: string | null
  shippingCountry: string | null
  deliveryNote: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    product: {
      name: string
      emoji: string
      imageUrl: string | null
      imageUrls?: string[] | null
    }
    variant: {
      color: string
      hex: string
    } | null
  }>
}

function formatShippingAddress(order: AdminOrderDetail): string | null {
  const lines = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingCountry].filter(Boolean).join(', '),
  ].filter(Boolean)

  if (lines.length === 0 && !order.shippingName && !order.shippingPhone) return null

  const parts = [order.shippingName, ...lines, order.shippingPhone].filter(Boolean)
  return parts.join('\n')
}

function Panel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-border bg-card rounded-md border p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-teal-600" /> : null}
        <h2 className="text-foreground text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SummaryRow({
  label,
  value,
  emphasis,
  discount,
}: {
  label: string
  value: string
  emphasis?: boolean
  discount?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 text-sm',
        emphasis && 'border-border border-t pt-3 text-base font-semibold',
        discount && 'text-teal-700 dark:text-teal-300',
        !emphasis && !discount && 'text-muted-foreground',
      )}>
      <dt>{label}</dt>
      <dd className="text-foreground tabular-nums">{value}</dd>
    </div>
  )
}

export function AdminOrderDetailView({ order }: { order: AdminOrderDetail }) {
  const shippingAddress = formatShippingAddress(order)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const placedLabel = `Placed ${formatOrderPlacedAt(order.createdAt)}`
  const totalLabel = formatCurrency(order.total)

  return (
    <AdminOrderStatusProvider orderId={order.id} initialStatus={order.status}>
      <div className="space-y-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300">
          <ArrowLeft className="size-4" />
          Back to orders
        </Link>

        <AdminOrderDetailHeaderLive
          orderId={order.id}
          placedLabel={placedLabel}
          itemCount={itemCount}
          totalLabel={totalLabel}
        />

        <Panel title="Fulfillment progress">
          <AdminOrderStatusStepperLive />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Panel title="Line items" icon={Package}>
              <ul className="divide-border divide-y">
                {order.items.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity
                  const imageUrl = item.product.imageUrl ?? item.product.imageUrls?.[0]

                  return (
                    <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="border-border bg-muted/50 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border text-2xl">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span aria-hidden>{item.product.emoji}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-foreground font-medium">{item.product.name}</p>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
                          {item.variant ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="border-border size-3 rounded-full border"
                                style={{ backgroundColor: item.variant.hex }}
                                aria-hidden
                              />
                              {item.variant.color}
                            </span>
                          ) : null}
                          <span>Qty {item.quantity}</span>
                          <span className="text-border">·</span>
                          <span>{formatCurrency(item.unitPrice)} each</span>
                        </div>
                      </div>

                      <p className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
                        {formatCurrency(lineTotal)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <Panel title="Update status">
              <p className="text-muted-foreground mb-4 text-sm">
                Move this order to the next fulfillment stage or cancel it if needed.
              </p>
              <AdminOrderStatusActionsLive />
            </Panel>
          </div>

          <aside className="space-y-6">
            <Panel title="Customer" icon={User}>
              <div className="space-y-3 text-sm">
                <p className="text-foreground font-medium">{order.user.name ?? 'No name on file'}</p>
                <a
                  href={`mailto:${order.user.email}`}
                  className="inline-flex items-center gap-2 text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400">
                  <Mail className="size-3.5 shrink-0" />
                  {order.user.email}
                </a>
              </div>
            </Panel>

            <Panel title="Shipping" icon={MapPin}>
              {shippingAddress ? (
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{shippingAddress}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No shipping address on file.</p>
              )}
              {order.deliveryNote ? (
                <div className="border-border bg-muted/40 mt-4 rounded-md border px-3 py-2">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Delivery note</p>
                  <p className="text-foreground mt-1 text-sm">{order.deliveryNote}</p>
                </div>
              ) : null}
            </Panel>

            <Panel title="Payment" icon={CreditCard}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="text-foreground font-medium">{order.paymentMethod}</dd>
                </div>
                {order.stripeSessionId ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Stripe session</dt>
                    <dd className="text-foreground max-w-40 truncate font-mono text-xs" title={order.stripeSessionId}>
                      {order.stripeSessionId}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Panel>

            <Panel title="Order summary">
              <dl className="space-y-2.5">
                <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                {order.discount > 0 ? (
                  <SummaryRow label="Discount" value={`−${formatCurrency(order.discount)}`} discount />
                ) : null}
                <SummaryRow label="Tax" value={formatCurrency(order.tax)} />
                <SummaryRow label="Shipping" value={order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)} />
                <SummaryRow label="Total" value={formatCurrency(order.total)} emphasis />
              </dl>
            </Panel>
          </aside>
        </div>
      </div>
    </AdminOrderStatusProvider>
  )
}
