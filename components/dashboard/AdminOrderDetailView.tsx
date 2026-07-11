import Link from 'next/link'
import {
  ArrowLeft,
  CreditCard,
  Mail,
  MapPin,
  Package,
  User,
} from 'lucide-react'
import { AdminOrderStatusActions } from '@/components/dashboard/AdminOrderStatusActions'
import { OrderDetailHeader } from '@/components/dashboard/OrderDetailHeader'
import { OrderStatusStepper } from '@/components/dashboard/OrderStatusStepper'
import { formatOrderPlacedAt } from '@/lib/orders/order-display'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { cn } from '@/lib/utils'

type OrderDetail = NonNullable<Awaited<ReturnType<typeof import('@/lib/services/orders').getOrderById>>>

function formatShippingAddress(order: OrderDetail): string | null {
  const lines = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingCountry].filter(Boolean).join(', '),
  ].filter(Boolean)

  if (lines.length === 0 && !order.shippingName && !order.shippingPhone) return null

  const parts = [
    order.shippingName,
    ...lines,
    order.shippingPhone,
  ].filter(Boolean)

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
    <section
      className={cn(
        'rounded-md border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-teal-600" /> : null}
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
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
        emphasis && 'border-t border-border pt-3 text-base font-semibold',
        discount && 'text-teal-700 dark:text-teal-300',
        !emphasis && !discount && 'text-muted-foreground',
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

export function AdminOrderDetailView({ order }: { order: OrderDetail }) {
  const shippingAddress = formatShippingAddress(order)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      <OrderDetailHeader
        orderId={order.id}
        status={order.status}
        placedLabel={`Placed ${formatOrderPlacedAt(order.createdAt)}`}
        itemCount={itemCount}
        totalLabel={formatCurrency(order.total)}
      />

      <Panel title="Fulfillment progress">
        <OrderStatusStepper status={order.status} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Line items" icon={Package}>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const lineTotal = item.unitPrice * item.quantity
                const imageUrl = item.product.imageUrl ?? item.product.imageUrls?.[0]

                return (
                  <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50 text-2xl">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span aria-hidden>{item.product.emoji}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {item.variant ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="size-3 rounded-full border border-border"
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

                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(lineTotal)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Update status">
            <p className="mb-4 text-sm text-muted-foreground">
              Move this order to the next fulfillment stage or cancel it if needed.
            </p>
            <AdminOrderStatusActions orderId={order.id} status={order.status} />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Customer" icon={User}>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">
                {order.user.name ?? 'No name on file'}
              </p>
              <a
                href={`mailto:${order.user.email}`}
                className="inline-flex items-center gap-2 text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400"
              >
                <Mail className="size-3.5 shrink-0" />
                {order.user.email}
              </a>
            </div>
          </Panel>

          <Panel title="Shipping" icon={MapPin}>
            {shippingAddress ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {shippingAddress}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address on file.</p>
            )}
            {order.deliveryNote ? (
              <div className="mt-4 rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Delivery note
                </p>
                <p className="mt-1 text-sm text-foreground">{order.deliveryNote}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Payment" icon={CreditCard}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium text-foreground">{order.paymentMethod}</dd>
              </div>
              {order.stripeSessionId ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Stripe session</dt>
                  <dd className="max-w-40 truncate font-mono text-xs text-foreground" title={order.stripeSessionId}>
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
                <SummaryRow
                  label="Discount"
                  value={`−${formatCurrency(order.discount)}`}
                  discount
                />
              ) : null}
              <SummaryRow label="Tax" value={formatCurrency(order.tax)} />
              <SummaryRow
                label="Shipping"
                value={order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}
              />
              <SummaryRow label="Total" value={formatCurrency(order.total)} emphasis />
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
