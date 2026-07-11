import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireSuperAdminSession } from '@/lib/admin-auth'
import { listActivityLogs } from '@/lib/services/activity-log'
import type { ActivityAction, ActivityEntityType } from '@/types/activity'

const ACTIONS = new Set<ActivityAction>(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ROLE_CHANGE'])
const ENTITY_TYPES = new Set<ActivityEntityType>([
  'USER',
  'PRODUCT',
  'STORE',
  'CATEGORY',
  'COUPON',
  'ORDER',
  'SYSTEM',
])

export async function GET(request: Request) {
  const session = await auth()
  const access = requireSuperAdminSession(session)
  if ('error' in access) return access.error

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')
  const search = searchParams.get('search') ?? undefined
  const actionParam = searchParams.get('action')
  const entityTypeParam = searchParams.get('entityType')

  const action =
    actionParam && ACTIONS.has(actionParam as ActivityAction)
      ? (actionParam as ActivityAction)
      : undefined
  const entityType =
    entityTypeParam && ENTITY_TYPES.has(entityTypeParam as ActivityEntityType)
      ? (entityTypeParam as ActivityEntityType)
      : undefined

  try {
    const result = await listActivityLogs({
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
      search,
      action,
      entityType,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
