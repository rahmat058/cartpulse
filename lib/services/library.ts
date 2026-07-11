import prisma from '@/lib/prisma'
import { isDigitalProduct } from '@/lib/utils/digital-products'

export type UserLibraryItem = {
  id: string
  productId: string
  orderId: string | null
  createdAt: string
  product: {
    id: string
    slug: string
    name: string
    emoji: string
    imageUrl: string | null
    price: number
    isDigital: boolean
    digitalAssetUrl: string | null
    store: { name: string; slug: string }
  }
}

function mapLibraryItem(row: {
  id: string
  productId: string
  orderId: string | null
  createdAt: Date
  product: {
    id: string
    slug: string
    name: string
    emoji: string
    imageUrl: string | null
    price: number
    isDigital: boolean
    digitalAssetUrl: string | null
    store: { name: string; slug: string }
  }
}): UserLibraryItem {
  return {
    id: row.id,
    productId: row.productId,
    orderId: row.orderId,
    createdAt: row.createdAt.toISOString(),
    product: {
      id: row.product.id,
      slug: row.product.slug,
      name: row.product.name,
      emoji: row.product.emoji,
      imageUrl: row.product.imageUrl,
      price: row.product.price,
      isDigital: row.product.isDigital,
      digitalAssetUrl: row.product.digitalAssetUrl,
      store: row.product.store,
    },
  }
}

const libraryInclude = {
  product: {
    include: {
      store: { select: { name: true, slug: true } },
    },
  },
} as const

export async function listUserLibrary(userId: string) {
  const rows = await prisma.libraryItem.findMany({
    where: { userId },
    include: libraryInclude,
    orderBy: { createdAt: 'desc' },
  })

  return rows.map(mapLibraryItem)
}

export async function userOwnsLibraryProduct(userId: string, productId: string) {
  const row = await prisma.libraryItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  return Boolean(row)
}

export async function grantLibraryAccessForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, isDigital: true } },
        },
      },
    },
  })

  if (!order) return []

  const digitalItems = order.items.filter((item) => isDigitalProduct(item.product))
  if (digitalItems.length === 0) return []

  const granted = []

  for (const item of digitalItems) {
    const row = await prisma.libraryItem.upsert({
      where: {
        userId_productId: {
          userId: order.userId,
          productId: item.productId,
        },
      },
      create: {
        userId: order.userId,
        productId: item.productId,
        orderId: order.id,
      },
      update: {
        orderId: order.id,
      },
      include: libraryInclude,
    })
    granted.push(mapLibraryItem(row))
  }

  return granted
}

export async function getLibraryDownloadTarget(userId: string, productId: string) {
  const item = await prisma.libraryItem.findUnique({
    where: { userId_productId: { userId, productId } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          isDigital: true,
          digitalAssetUrl: true,
        },
      },
    },
  })

  if (!item || !item.product.isDigital) {
    return null
  }

  const url = item.product.digitalAssetUrl?.trim()
  if (!url) {
    return { productName: item.product.name, url: null }
  }

  return { productName: item.product.name, url }
}
