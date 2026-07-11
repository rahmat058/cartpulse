import { renderToBuffer } from '@react-pdf/renderer'
import { OrderDetailPdfDocument } from '@/lib/pdf/OrderDetailPdfDocument'
import type { OrderDisplayData } from '@/lib/orders/order-display'

export async function renderOrderDetailPdf(order: OrderDisplayData) {
  return renderToBuffer(<OrderDetailPdfDocument order={order} />)
}
