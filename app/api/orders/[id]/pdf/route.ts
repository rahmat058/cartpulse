import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminPanelUser } from '@/lib/auth-access'
import { toOrderDisplayData } from '@/lib/orders/order-display'
import { renderOrderDetailPdf } from '@/lib/pdf/render-order-pdf'
import { getOrderById } from '@/lib/services/orders'

export const runtime = 'nodejs'

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

  const pdfBuffer = await renderOrderDetailPdf(toOrderDisplayData(order))

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="order-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
