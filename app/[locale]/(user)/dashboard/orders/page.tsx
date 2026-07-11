import { Package } from 'lucide-react'
import { auth } from '@/lib/auth'
import { listUserOrders } from '@/lib/services/orders'
import { UserOrdersTable } from '@/components/dashboard/UserOrdersTable'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'

export default async function DashboardOrdersPage() {
  const session = await auth()
  const orders = session?.user?.id ? await listUserOrders(session.user.id) : []

  return (
    <div className="space-y-5">
      {orders.length === 0 ? (
        <AccountEmptyState
          title="No orders yet"
          description="When you place your first order, you'll be able to track it here."
          icon={<Package className="h-9 w-9" strokeWidth={1.5} />}
        />
      ) : (
        <UserOrdersTable
          orders={orders.map((order) => ({
            id: order.id,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt.toISOString(),
            itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          }))}
        />
      )}
    </div>
  )
}
