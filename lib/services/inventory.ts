import type { Prisma } from '@/app/generated/prisma/client'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import { isDigitalProduct } from '@/lib/utils/digital-products'

export type OrderFulfillmentLine = {
  productId: string
  variantId: string | null
  quantity: number
  productName: string
}

type InventoryTx = Prisma.TransactionClient

async function syncProductStockFromVariants(tx: InventoryTx, productId: string) {
  const variants = await tx.productVariant.findMany({ where: { productId } })
  if (variants.length === 0) return

  const total = variants.reduce((sum, variant) => sum + variant.stock, 0)
  await tx.product.update({
    where: { id: productId },
    data: { stock: total },
  })
}

export async function assertSufficientStockForOrderLines(
  tx: InventoryTx,
  lines: OrderFulfillmentLine[],
): Promise<void> {
  for (const line of lines) {
    const productMeta = await tx.product.findFirst({
      where: { id: line.productId, ...NOT_DELETED },
      select: { isDigital: true },
    })
    if (productMeta && isDigitalProduct(productMeta)) continue

    if (line.variantId) {
      const variant = await tx.productVariant.findFirst({
        where: { id: line.variantId, productId: line.productId },
      })
      if (!variant || variant.stock < line.quantity) {
        throw new Error(`Not enough stock for ${line.productName}`)
      }
      continue
    }

    const product = await tx.product.findFirst({
      where: { id: line.productId, ...NOT_DELETED },
      include: { variants: true },
    })
    if (!product) {
      throw new Error(`${line.productName} is no longer available`)
    }
    if (product.variants.length > 0) {
      throw new Error(`Please select a variant for ${line.productName}`)
    }
    if (product.stock < line.quantity) {
      throw new Error(`Not enough stock for ${line.productName}`)
    }
  }
}

export async function decrementStockForOrderLines(
  tx: InventoryTx,
  lines: OrderFulfillmentLine[],
): Promise<void> {
  await assertSufficientStockForOrderLines(tx, lines)

  const productsToSync = new Set<string>()

  for (const line of lines) {
    const productMeta = await tx.product.findFirst({
      where: { id: line.productId, ...NOT_DELETED },
      select: { isDigital: true },
    })
    if (productMeta && isDigitalProduct(productMeta)) continue

    if (line.variantId) {
      const updated = await tx.productVariant.updateMany({
        where: { id: line.variantId, productId: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      })
      if (updated.count === 0) {
        throw new Error(`Not enough stock for ${line.productName}`)
      }
      productsToSync.add(line.productId)
      continue
    }

    const updated = await tx.product.updateMany({
      where: { id: line.productId, ...NOT_DELETED, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    })
    if (updated.count === 0) {
      throw new Error(`Not enough stock for ${line.productName}`)
    }
  }

  for (const productId of productsToSync) {
    await syncProductStockFromVariants(tx, productId)
  }
}
