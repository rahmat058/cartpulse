import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminPanelUser } from '@/lib/auth-access'
import { listAllOrders, listUserOrders } from '@/lib/services/orders'
import type { OrderStatus } from '@/app/generated/prisma/client'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as OrderStatus | null

  try {
    if (isAdminPanelUser(session.user.role)) {
      const orders = await listAllOrders(status ? { status } : undefined)
      return NextResponse.json({ data: orders })
    }

    const orders = await listUserOrders(session.user.id)
    return NextResponse.json({ data: orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
