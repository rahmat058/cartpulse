import Link from 'next/link'
import { ArrowLeft, CreditCard, MapPin, Package, Truck } from 'lucide-react'
import { OrderDetailHeader } from '@/components/dashboard/OrderDetailHeader'
import { OrderStatusStepper } from '@/components/dashboard/OrderStatusStepper'
import {
  formatOrderMoney,
  formatOrderPlacedAt,
  formatPaymentMethod,
  formatShippingAddress,
} from '@/lib/orders/order-display'
import { cn } from '@/lib/utils'

type OrderDetail = NonNullable<Awaited<ReturnType<typeof import('@/lib/services/orders').getOrderById>>>

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
    <section className={cn('rounded-md border border-border bg-card p-5 shadow-sm', className)}>
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

export function UserOrderDetailView({ order }: { order: OrderDetail }) {
  const shippingAddress = formatShippingAddress(order)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
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
        totalLabel={formatOrderMoney(order.total)}
      />

      <Panel title="Delivery progress" icon={Truck}>
        <OrderStatusStepper status={order.status} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Items in this order" icon={Package}>
          <ul className="divide-y divide-border">
            {order.items.map((item) => {
              const lineTotal = item.unitPrice * item.quantity
              const imageUrl = item.product.imageUrl ?? item.product.imageUrls?.[0]

              return (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50 text-2xl">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="size-full object-cover" />
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
                      <span>{formatOrderMoney(item.unitPrice)} each</span>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatOrderMoney(lineTotal)}
                  </p>
                </li>
              )
            })}
          </ul>
        </Panel>

        <aside className="space-y-6">
          <Panel title="Shipping address" icon={MapPin}>
            {shippingAddress ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{shippingAddress}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address on file.</p>
            )}
            {order.deliveryNote ? (
              <div className="mt-4 rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery note</p>
                <p className="mt-1 text-sm text-foreground">{order.deliveryNote}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Payment" icon={CreditCard}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium text-foreground">{formatPaymentMethod(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-foreground">{order.status}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Order summary">
            <dl className="space-y-2.5">
              <SummaryRow label="Subtotal" value={formatOrderMoney(order.subtotal)} />
              {order.discount > 0 ? (
                <SummaryRow label="Discount" value={`−${formatOrderMoney(order.discount)}`} discount />
              ) : null}
              <SummaryRow label="Tax" value={formatOrderMoney(order.tax)} />
              <SummaryRow
                label="Shipping"
                value={order.shipping === 0 ? 'Free' : formatOrderMoney(order.shipping)}
              />
              <SummaryRow label="Total" value={formatOrderMoney(order.total)} emphasis />
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
