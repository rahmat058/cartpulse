import Link from 'next/link'
import { AlertTriangle, DollarSign, Package, Plus, ShoppingBag, Users } from 'lucide-react'
import { getAdminKpis, getAnalytics, listAllOrders } from '@/lib/services/orders'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { AdminOverviewCharts } from '@/components/dashboard/AdminOverviewCharts'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { orderStatusBadgeVariant } from '@/lib/orders/order-display'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const [kpis, orders, analytics] = await Promise.all([
    getAdminKpis(),
    listAllOrders(),
    getAnalytics(30),
  ])
  const recent = orders.slice(0, 8)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Revenue, orders, and storefront activity at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={`$${kpis.revenue.toLocaleString()}`} icon={DollarSign} tone="teal" />
        <KpiCard label="Orders" value={kpis.orderCount.toLocaleString()} icon={ShoppingBag} tone="cyan" />
        <KpiCard label="Users" value={kpis.userCount.toLocaleString()} icon={Users} tone="teal" />
        <KpiCard
          label="Low stock"
          value={kpis.lowStock.toLocaleString()}
          icon={kpis.lowStock > 0 ? AlertTriangle : Package}
          tone="amber"
        />
      </div>

      <AdminOverviewCharts initialData={analytics} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
            <p className="text-sm text-muted-foreground">Latest activity across the storefront</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              View all orders
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((order) => (
                    <tr key={order.id} className="border-t border-border transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {order.user.name ?? order.user.email}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge variant={orderStatusBadgeVariant(order.status)}>
                          {order.status}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/products">
          <Button size="sm">
            <Plus />
            Add product
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline" size="sm">
            Full analytics
          </Button>
        </Link>
      </div>
    </div>
  )
}
