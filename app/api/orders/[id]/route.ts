import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logAdminActivity } from '@/lib/admin-activity'
import { isAdminPanelUser } from '@/lib/auth-access'
import { requireAdminAction } from '@/lib/admin-auth'
import { getOrderById, updateOrderStatus } from '@/lib/services/orders'
import type { OrderStatus } from '@/app/generated/prisma/client'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const userId = isAdminPanelUser(session.user.role) ? undefined : session.user.id
  const order = await getOrderById(id, userId)

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: order })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const access = requireAdminAction(session, 'update')
  if ('error' in access) return access.error

  const { id } = await context.params
  const body = (await request.json()) as { status?: OrderStatus }

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const order = await updateOrderStatus(id, body.status)
  logAdminActivity(access.user, 'STATUS_CHANGE', 'ORDER', {
    entityId: order.id,
    entityLabel: order.id,
    summary: `Changed order ${order.id.slice(0, 8)}… status to ${body.status}`,
    metadata: { status: body.status },
  })
  return NextResponse.json({ data: order })
}
