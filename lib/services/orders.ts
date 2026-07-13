import prisma from '@/lib/prisma'
import type { OrderStatus } from '@/app/generated/prisma/client'
import { getActiveCouponByCode, recordCouponUsage } from '@/lib/services/coupons'
import {
  assertSufficientStockForOrderLines,
  decrementStockForOrderLines,
  type OrderFulfillmentLine,
} from '@/lib/services/inventory'
import type { AppRole } from '@/types/auth'
import type { CartItemsById } from '@/types/cart'
import { NOT_DELETED } from '@/lib/services/soft-delete'
import { getProductsByIds } from '@/lib/services/products'
import { grantLibraryAccessForOrder } from '@/lib/services/library'
import { notifyOrderStatusChange } from '@/lib/services/notifications'
import { sanitizeCartItemsById } from '@/lib/validations/cart'
import { getDefaultPricingSettings } from '@/lib/services/stores'
import { calculateCartPricing, resolveLineUnitPrice } from '@/lib/utils/cartPricing'
import { cartHasDigitalProduct, cartIsAllDigital } from '@/lib/utils/digital-products'

export interface OrderLineInput {
  productId: string
  variantId?: string
  quantity: number
}

export interface ShippingAddressInput {
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  country: string
}

export async function createOrderFromCart(
  userId: string,
  itemsById: CartItemsById,
  promoCode: string | null,
  options?: {
    paymentMethod?: 'COD' | 'STRIPE'
    deliveryNote?: string | null
    shippingAddress?: ShippingAddressInput | null
  },
) {
  const sanitizedItems = sanitizeCartItemsById(itemsById)
  const cartLines = Object.values(sanitizedItems)

  const productIds = [...new Set(cartLines.map((line) => line.productId))]
  const products = await getProductsByIds(productIds)
  const productsById = Object.fromEntries(products.map((product) => [product.id, product]))

  const missing = productIds.filter((id) => !productsById[id])
  if (missing.length > 0) {
    throw new Error(
      missing.length === 1
        ? 'One item in your cart is no longer available. Remove it and try again.'
        : 'Some items in your cart are no longer available. Remove them and try again.',
    )
  }

  const defaults = await getDefaultPricingSettings()
  const normalizedPromo = promoCode?.trim().toUpperCase() || null
  const coupon = normalizedPromo ? await getActiveCouponByCode(normalizedPromo) : null

  if (normalizedPromo && !coupon) {
    throw new Error('Invalid or expired promo code')
  }

  const allDigital = cartIsAllDigital(cartLines, productsById)

  const pricing = calculateCartPricing({
    itemsById: sanitizedItems,
    productsById,
    promoCode: coupon?.code ?? null,
    coupon,
    taxRate: defaults.taxRate,
    shippingFlat: allDigital ? 0 : defaults.shippingFlat,
    freeShippingThreshold: allDigital ? 0 : defaults.freeShippingThreshold,
  })

  if (coupon && pricing.discount <= 0) {
    if (coupon.minSubtotal != null) {
      throw new Error(`Minimum subtotal of $${coupon.minSubtotal.toFixed(2)} required for this promo code`)
    }
    throw new Error('This promo code could not be applied to your cart')
  }

  const appliedPromoCode = pricing.discount > 0 && coupon ? coupon.code : null

  const lines = cartLines.map((line) => {
    const product = productsById[line.productId]!
    const variant = line.variantId ? product.variants?.find((entry) => entry.id === line.variantId) : undefined

    if (line.variantId && !variant) {
      throw new Error(`Variant for ${product.name} is no longer available`)
    }

    return {
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: line.quantity,
      unitPrice: resolveLineUnitPrice(product, line.variantId),
    }
  })

  const address = options?.shippingAddress
  const paymentMethod = options?.paymentMethod ?? 'STRIPE'

  if (paymentMethod === 'COD' && cartHasDigitalProduct(cartLines, productsById)) {
    throw new Error('Digital products must be paid online. Cash on delivery is not available.')
  }

  const fulfillmentLines: OrderFulfillmentLine[] = lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    quantity: line.quantity,
    productName: productsById[line.productId]!.name,
  }))

  return prisma.$transaction(async (tx) => {
    if (paymentMethod === 'COD') {
      await decrementStockForOrderLines(tx, fulfillmentLines)
    } else {
      await assertSufficientStockForOrderLines(tx, fulfillmentLines)
    }

    return tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        paymentMethod,
        deliveryNote: options?.deliveryNote ?? null,
        shippingName: address?.fullName ?? null,
        shippingPhone: address?.phone ?? null,
        shippingLine1: address?.line1 ?? null,
        shippingLine2: address?.line2 ?? null,
        shippingCity: address?.city ?? null,
        shippingCountry: address?.country ?? null,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        shipping: pricing.shipping,
        discount: pricing.discount,
        total: pricing.total,
        promoCode: appliedPromoCode,
        items: { create: lines },
      },
      include: {
        items: {
          include: {
            product: { include: { store: true } },
            variant: true,
          },
        },
        user: true,
      },
    })
  })
}

export async function listUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: { include: { product: true, variant: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listUserOrdersPage(
  userId: string,
  filters?: {
    status?: OrderStatus
    search?: string
    page?: number
    pageSize?: number
  },
) {
  const page = Math.max(1, filters?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 10))
  const skip = (page - 1) * pageSize
  const search = filters?.search?.trim()

  const where = {
    userId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(search ? { id: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true, variant: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ])

  const data = rows.map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }))

  return { data, total, page, pageSize }
}

export async function listAllOrders(filters?: { status?: OrderStatus }) {
  return prisma.order.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    include: {
      items: { include: { product: true, variant: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listAllOrdersPage(filters?: {
  status?: OrderStatus
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const page = Math.max(1, filters?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 10))
  const skip = (page - 1) * pageSize
  const search = filters?.search?.trim()

  const createdAt: { gte?: Date; lte?: Date } = {}
  if (filters?.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`)
    if (!Number.isNaN(from.getTime())) createdAt.gte = from
  }
  if (filters?.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`)
    if (!Number.isNaN(to.getTime())) createdAt.lte = to
  }

  const where = {
    ...(filters?.status ? { status: filters.status } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [total, data] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true, variant: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ])

  return { data, total, page, pageSize }
}

export async function getOrderById(id: string, userId?: string) {
  return prisma.order.findFirst({
    where: { id, ...(userId ? { userId } : {}) },
    include: {
      items: { include: { product: true, variant: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true, userId: true },
  })

  if (!existing) {
    throw new Error('Order not found')
  }

  // Lean update — return quickly; notify + library run after the response via `after()`.
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      status: true,
      userId: true,
      total: true,
      createdAt: true,
    },
  })

  const previousStatus = existing.status
  const userId = existing.userId
  const shouldGrantLibrary = status === 'PAID' && previousStatus !== 'PAID'

  return {
    order,
    scheduleSideEffects: () => {
      void notifyOrderStatusChange(userId, id, previousStatus, status).catch((error) => {
        console.error('[orders] notifyOrderStatusChange failed', error)
      })
      if (shouldGrantLibrary) {
        void grantLibraryAccessForOrder(id).catch((error) => {
          console.error('[orders] grantLibraryAccessForOrder failed', error)
        })
      }
    },
  }
}

export async function markOrderPaid(orderId: string, stripeSessionId: string) {
  let previousStatus: OrderStatus | null = null
  let notifyUserId: string | null = null

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    })

    if (!existing) {
      throw new Error('Order not found')
    }

    if (existing.status === 'PAID') {
      await grantLibraryAccessForOrder(orderId)
      return existing
    }

    previousStatus = existing.status
    notifyUserId = existing.userId

    const fulfillmentLines: OrderFulfillmentLine[] = existing.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.product.name,
    }))

    await decrementStockForOrderLines(tx, fulfillmentLines)

    return tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID', stripeSessionId },
      include: {
        user: true,
        items: { include: { product: true, variant: true } },
      },
    })
  })

  if (notifyUserId && previousStatus) {
    await notifyOrderStatusChange(notifyUserId, orderId, previousStatus, 'PAID')
  }

  await grantLibraryAccessForOrder(orderId)
  await recordCouponUsage(order.promoCode, order.discount)
  return order
}

export async function getAdminKpis() {
  const [orderCount, userCount, revenueAgg, lowStock] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
  ])

  return {
    orderCount,
    userCount,
    revenue: revenueAgg._sum.total ?? 0,
    lowStock,
  }
}

export async function getAnalytics(rangeDays = 30) {
  const since = new Date()
  since.setDate(since.getDate() - rangeDays)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const byDay = new Map<string, { revenue: number; orders: number }>()
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    const current = byDay.get(key) ?? { revenue: 0, orders: 0 }
    current.revenue += order.total
    current.orders += 1
    byDay.set(key, current)
  }

  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId
      const current = productSales.get(key) ?? {
        name: item.product.name,
        quantity: 0,
        revenue: 0,
      }
      current.quantity += item.quantity
      current.revenue += item.unitPrice * item.quantity
      productSales.set(key, current)
    }
  }

  const topProducts = [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return {
    series: [...byDay.entries()].map(([date, values]) => ({ date, ...values })),
    topProducts,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    totalOrders: orders.length,
  }
}

export async function listUsers(options?: { role?: AppRole; search?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 10))
  const skip = (page - 1) * pageSize
  const search = options?.search?.trim()

  const where = {
    ...NOT_DELETED,
    ...(options?.role ? { role: options.role } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permCreate: true,
        permRead: true,
        permUpdate: true,
        permDelete: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ])

  return { data, total, page, pageSize }
}
