import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { orderStatusBadgeVariant } from '@/lib/orders/order-display'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { getAdminKpis, listAllOrdersPage } from '@/lib/services/orders'
import { AdminOverviewCharts } from '@/components/dashboard/AdminOverviewCharts'
import { AlertTriangle, DollarSign, Package, Plus, ShoppingBag, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  // KPIs + 8 recent orders only — analytics charts fetch client-side (was blocking nav with full order dump).
  const [kpis, recentPage] = await Promise.all([getAdminKpis(), listAllOrdersPage({ page: 1, pageSize: 8 })])
  const recent = recentPage.data

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Overview" description="Revenue, orders, and storefront activity at a glance." />

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

      <AdminOverviewCharts />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Recent orders</h2>
            <p className="text-muted-foreground text-sm">Latest activity across the storefront</p>
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
              <thead className="border-border bg-muted/40 border-b text-left">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                    Customer
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                    Status
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                    Date
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((order) => (
                    <tr key={order.id} className="border-border hover:bg-muted/30 border-t transition-colors">
                      <td className="text-foreground px-4 py-3 font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:text-teal-700 hover:underline dark:hover:text-teal-300">
                          {order.user.name ?? order.user.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge variant={orderStatusBadgeVariant(order.status)}>
                          {order.status}
                        </AdminStatusBadge>
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{order.createdAt.toLocaleDateString()}</td>
                      <td className="text-foreground px-4 py-3 text-right font-semibold tabular-nums">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground px-4 py-10 text-center">
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
