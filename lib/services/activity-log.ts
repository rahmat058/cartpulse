import type { Prisma } from '@/app/generated/prisma/client'
import prisma from '@/lib/prisma'
import { NOT_DELETED } from '@/lib/core/constants'
import type {
  ActivityAction,
  ActivityEntityType,
  AdminActivityLogRow,
  ListActivityLogsParams,
  RecordActivityInput,
} from '@/types/activity'

/** Only admin-panel actors — excludes customer (USER role) actions. */
const ADMIN_PANEL_ACTOR_FILTER: Prisma.ActivityLogWhereInput = {
  actor: {
    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
    ...NOT_DELETED,
  },
}

function mapActivityRow(row: {
  id: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string | null
  entityLabel: string | null
  summary: string
  metadata: Prisma.JsonValue
  createdAt: Date
  actor: { id: string; name: string | null; email: string; role: 'ADMIN' | 'SUPER_ADMIN' } | null
}): AdminActivityLogRow {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    entityLabel: row.entityLabel,
    summary: row.summary,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor
      ? {
          id: row.actor.id,
          name: row.actor.name,
          email: row.actor.email,
          role: row.actor.role,
        }
      : null,
  }
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  const actor = await prisma.user.findFirst({
    where: { id: input.actorId, ...NOT_DELETED },
    select: { role: true },
  })

  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN')) {
    return
  }

  await prisma.activityLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      summary: input.summary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function listActivityLogs(
  params: ListActivityLogsParams = {},
): Promise<{ data: AdminActivityLogRow[]; total: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize
  const search = params.search?.trim()

  const where: Prisma.ActivityLogWhereInput = {
    AND: [
      ADMIN_PANEL_ACTOR_FILTER,
      ...(params.action ? [{ action: params.action }] : []),
      ...(params.entityType ? [{ entityType: params.entityType }] : []),
      ...(search
        ? [
            {
              OR: [
                { summary: { contains: search, mode: 'insensitive' } },
                { entityLabel: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
                {
                  actor: {
                    email: { contains: search, mode: 'insensitive' },
                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                  },
                },
                {
                  actor: {
                    name: { contains: search, mode: 'insensitive' },
                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  }

  const [rows, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    data: rows.map(mapActivityRow),
    total,
  }
}
