import prisma from '@/lib/prisma'
import type { NotificationType, OrderStatus } from '@/app/generated/prisma/client'

export type UserNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  orderId: string | null
  readAt: string | null
  createdAt: string
}

const NOTIFIABLE_STATUSES: OrderStatus[] = ['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8)
}

function orderStatusNotificationCopy(status: OrderStatus, orderId: string): { title: string; body: string } {
  const shortId = shortOrderId(orderId)

  switch (status) {
    case 'PAID':
      return {
        title: 'Payment confirmed',
        body: `Your order #${shortId}… has been paid and is being prepared.`,
      }
    case 'SHIPPED':
      return {
        title: 'Order shipped',
        body: `Your order #${shortId}… is on its way. Track it in My Orders.`,
      }
    case 'DELIVERED':
      return {
        title: 'Order delivered',
        body: `Your order #${shortId}… has been delivered. Thanks for shopping with us!`,
      }
    case 'CANCELLED':
      return {
        title: 'Order cancelled',
        body: `Your order #${shortId}… was cancelled. Contact support if you have questions.`,
      }
    default:
      return {
        title: 'Order update',
        body: `Your order #${shortId}… status changed to ${status.toLowerCase()}.`,
      }
  }
}

function mapNotification(row: {
  id: string
  type: NotificationType
  title: string
  body: string
  orderId: string | null
  readAt: Date | null
  createdAt: Date
}): UserNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    orderId: row.orderId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createOrderStatusNotification(userId: string, orderId: string, status: OrderStatus) {
  const { title, body } = orderStatusNotificationCopy(status, orderId)

  return prisma.notification.create({
    data: {
      userId,
      type: 'ORDER_UPDATE',
      title,
      body,
      orderId,
    },
  })
}

export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus,
) {
  if (previousStatus === newStatus) return null
  if (!NOTIFIABLE_STATUSES.includes(newStatus)) return null

  return createOrderStatusNotification(userId, orderId, newStatus)
}

export async function listUserNotifications(userId: string, limit = 50) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return rows.map(mapNotification)
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  })
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, readAt: true },
  })

  if (!existing) {
    throw new Error('Notification not found')
  }

  if (existing.readAt) {
    return existing
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}
