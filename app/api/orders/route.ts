import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminPanelUser } from '@/lib/auth-access'
import { parsePageSearchParams } from '@/lib/api/pagination'
import { listAllOrdersPage, listUserOrders } from '@/lib/services/orders'
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
      const { page, pageSize } = parsePageSearchParams(searchParams)
      const search = searchParams.get('search')?.trim() || undefined
      const dateFrom = searchParams.get('dateFrom')?.trim() || undefined
      const dateTo = searchParams.get('dateTo')?.trim() || undefined
      const result = await listAllOrdersPage({
        status: status ?? undefined,
        search,
        dateFrom,
        dateTo,
        page,
        pageSize,
      })
      return NextResponse.json(result)
    }

    const orders = await listUserOrders(session.user.id)
    return NextResponse.json({ data: orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
