import { after, NextResponse } from 'next/server'
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

  try {
    const { order, scheduleSideEffects } = await updateOrderStatus(id, body.status)

    // Keep the PATCH response fast — notifications / library grants run after flush.
    after(() => {
      scheduleSideEffects()
    })

    logAdminActivity(access.user, 'STATUS_CHANGE', 'ORDER', {
      entityId: order.id,
      entityLabel: order.id,
      summary: `Changed order ${order.id.slice(0, 8)}… status to ${body.status}`,
      metadata: { status: body.status },
    })
    return NextResponse.json({ data: order })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status'
    const status = message === 'Order not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
