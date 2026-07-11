import { recordActivity } from '@/lib/services/activity-log'
import type { ActivityAction, ActivityEntityType } from '@/types/activity'
import type { AppRole } from '@/types/auth'

type ActivityActor = {
  id: string
  role: AppRole
  email?: string | null
  name?: string | null
}

type LogActivityDetails = {
  entityId?: string
  entityLabel?: string
  summary?: string
  metadata?: Record<string, unknown>
}

/** Fire-and-forget activity log from admin API routes — never blocks the response. */
export function logAdminActivity(
  actor: ActivityActor,
  action: ActivityAction,
  entityType: ActivityEntityType,
  details: LogActivityDetails = {},
): void {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') return

  const entityLabel = details.entityLabel ?? details.entityId
  const summary =
    details.summary ??
    `${action.toLowerCase().replace('_', ' ')} ${entityType.toLowerCase()}${entityLabel ? `: ${entityLabel}` : ''}`

  void recordActivity({
    actorId: actor.id,
    action,
    entityType,
    entityId: details.entityId,
    entityLabel: details.entityLabel,
    summary,
    metadata: details.metadata,
  }).catch((error) => {
    console.error('Failed to record admin activity:', error)
  })
}
