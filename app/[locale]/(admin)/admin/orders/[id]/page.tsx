import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdminPanelUser } from '@/lib/auth-access'
import { getOrderById } from '@/lib/services/orders'
import { AdminOrderDetailView } from '@/components/dashboard/AdminOrderDetailView'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || !isAdminPanelUser(session.user.role)) notFound()

  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  return <AdminOrderDetailView order={order} />
}
