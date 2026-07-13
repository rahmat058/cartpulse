import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminPanelUser } from '@/lib/auth-access'
import { parsePageSearchParams } from '@/lib/api/pagination'
import { listAllOrdersPage, listUserOrdersPage } from '@/lib/services/orders'
import type { OrderStatus } from '@/app/generated/prisma/client'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as OrderStatus | null
  const { page, pageSize } = parsePageSearchParams(searchParams)
  const search = searchParams.get('search')?.trim() || undefined

  try {
    if (isAdminPanelUser(session.user.role)) {
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

    const result = await listUserOrdersPage(session.user.id, {
      status: status ?? undefined,
      search,
      page,
      pageSize,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
