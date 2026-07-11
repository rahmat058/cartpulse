import { format } from 'date-fns'
import type { OrderStatus } from '@/app/generated/prisma/client'
import type { AdminProductRow } from '@/types/admin'
import type { AdminActivityLogRow } from '@/types/activity'
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
} from '@/types/activity'
import type { ExportRow } from '@/lib/export/spreadsheet'

export interface AdminOrderExportRow {
  id: string
  status: OrderStatus
  total: number
  createdAt: string
  user: { name: string | null; email: string }
}

export function mapProductRowsForExport(products: AdminProductRow[]): ExportRow[] {
  return products.map((product) => ({
    'Product ID': product.id,
    Name: product.name,
    Slug: product.slug,
    Store: product.store.name,
    Category: product.category.name,
    Price: product.price,
    Stock: product.stock,
    Variants: product.variantCount,
    Status: product.published ? 'Published' : 'Draft',
  }))
}

export function mapOrderRowsForExport(orders: AdminOrderExportRow[]): ExportRow[] {
  return orders.map((order) => ({
    'Order ID': order.id,
    'Customer Name': order.user.name ?? '',
    'Customer Email': order.user.email,
    Date: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
    Status: order.status,
    Total: order.total,
  }))
}

export interface UserOrderExportRow {
  id: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

export function mapUserOrderRowsForExport(orders: UserOrderExportRow[]): ExportRow[] {
  return orders.map((order) => ({
    'Order ID': order.id,
    Date: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
    Items: order.itemCount,
    Status: order.status,
    Total: order.total,
  }))
}

export function mapActivityRowsForExport(logs: AdminActivityLogRow[]): ExportRow[] {
  return logs.map((log) => ({
    When: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm'),
    'Admin Name': log.actor?.name ?? '',
    'Admin Email': log.actor?.email ?? '',
    'Admin Role': log.actor?.role === 'SUPER_ADMIN' ? 'Super Admin' : log.actor?.role === 'ADMIN' ? 'Admin' : '',
    Action: ACTIVITY_ACTION_LABELS[log.action],
    'Entity Type': ACTIVITY_ENTITY_LABELS[log.entityType],
    'Entity Label': log.entityLabel ?? '',
    'Entity ID': log.entityId ?? '',
    Summary: log.summary,
    Metadata: log.metadata ? JSON.stringify(log.metadata) : '',
  }))
}
