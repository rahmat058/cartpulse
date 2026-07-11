export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ROLE_CHANGE'

export type ActivityEntityType =
  | 'USER'
  | 'PRODUCT'
  | 'STORE'
  | 'CATEGORY'
  | 'COUPON'
  | 'ORDER'
  | 'SYSTEM'

export interface AdminActivityLogRow {
  id: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string | null
  entityLabel: string | null
  summary: string
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: {
    id: string
    name: string | null
    email: string
    role: 'ADMIN' | 'SUPER_ADMIN'
  } | null
}

export interface RecordActivityInput {
  actorId: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId?: string
  entityLabel?: string
  summary: string
  metadata?: Record<string, unknown>
}

export interface ListActivityLogsParams {
  page?: number
  pageSize?: number
  search?: string
  action?: ActivityAction
  entityType?: ActivityEntityType
}

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  STATUS_CHANGE: 'Status changed',
  ROLE_CHANGE: 'Role changed',
}

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  USER: 'User',
  PRODUCT: 'Product',
  STORE: 'Store',
  CATEGORY: 'Category',
  COUPON: 'Promo code',
  ORDER: 'Order',
  SYSTEM: 'System',
}

export type ActivityActionBadgeVariant = 'success' | 'warning' | 'danger' | 'teal' | 'info' | 'muted'

export function activityActionBadgeVariant(action: ActivityAction): ActivityActionBadgeVariant {
  switch (action) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'teal'
    case 'DELETE':
      return 'danger'
    case 'ROLE_CHANGE':
      return 'warning'
    case 'STATUS_CHANGE':
      return 'info'
    default:
      return 'muted'
  }
}
