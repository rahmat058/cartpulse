import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOrderById } from '@/lib/services/orders'
import { UserOrderDetailView } from '@/components/dashboard/UserOrderDetailView'

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params
  const order = session?.user?.id ? await getOrderById(id, session.user.id) : null

  if (!order) notFound()

  return <UserOrderDetailView order={order} />
}
