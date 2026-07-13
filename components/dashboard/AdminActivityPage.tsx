'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { ActivityDetailDialog } from '@/components/admin/ActivityDetailDialog'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { TableExportMenu } from '@/components/admin/TableExportMenu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import type {
  ActivityAction,
  ActivityEntityType,
  AdminActivityLogRow,
} from '@/types/activity'
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  activityActionBadgeVariant,
} from '@/types/activity'
import { mapActivityRowsForExport } from '@/lib/export/admin-table-rows'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminActivityLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [action, setAction] = useState<'ALL' | ActivityAction>('ALL')
  const [entityType, setEntityType] = useState<'ALL' | ActivityEntityType>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [detailRow, setDetailRow] = useState<AdminActivityLogRow | null>(null)

  const loadLogs = useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (action !== 'ALL') params.set('action', action)
    if (entityType !== 'ALL') params.set('entityType', entityType)

    fetch(`/api/admin/activity?${params}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json()) as { error?: string }
          throw new Error(body.error ?? 'Failed to load activity')
        }
        return response.json() as Promise<{ data: AdminActivityLogRow[]; total: number }>
      })
      .then((json) => {
        setLogs(json.data)
        setTotal(json.total)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [action, entityType, page, pageSize, debouncedSearch])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, action, entityType])

  const columns = useMemo<ColumnDef<AdminActivityLogRow>[]>(
    () => [
      {
        id: 'createdAt',
        header: 'When',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-foreground">
            {formatTimestamp(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actor',
        header: 'Admin',
        cell: ({ row }) => {
          const actor = row.original.actor
          if (!actor) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{actor.name ?? 'Unnamed user'}</p>
                <AdminStatusBadge variant={actor.role === 'SUPER_ADMIN' ? 'success' : 'warning'}>
                  {actor.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </AdminStatusBadge>
              </div>
              <p className="text-xs text-muted-foreground">{actor.email}</p>
            </div>
          )
        },
      },
      {
        id: 'action',
        header: 'Action',
        accessorKey: 'action',
        cell: ({ row }) => (
          <AdminStatusBadge variant={activityActionBadgeVariant(row.original.action)}>
            {ACTIVITY_ACTION_LABELS[row.original.action]}
          </AdminStatusBadge>
        ),
      },
      {
        id: 'entityType',
        header: 'Type',
        accessorKey: 'entityType',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {ACTIVITY_ENTITY_LABELS[row.original.entityType]}
          </span>
        ),
      },
      {
        id: 'summary',
        header: 'Summary',
        accessorKey: 'summary',
        cell: ({ row }) => (
          <p className="max-w-md truncate text-sm text-foreground" title={row.original.summary}>
            {row.original.summary}
          </p>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Activity"
        description="Audit trail of admin panel actions — only events performed by admins and super admins."
        action={
          <TableExportMenu
            filenameBase="activity-log"
            sheetName="Activity"
            page={page}
            rows={mapActivityRowsForExport(logs)}
            rowCount={logs.length}
            disabled={loading || logs.length === 0}
          />
        }
      />

      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        error={error}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by admin, summary, or entity…"
        enableRowSelection={false}
        manualPagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage="No activity recorded yet."
        filters={
          <>
            <Select value={action} onValueChange={(value) => setAction(value as 'ALL' | ActivityAction)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All actions</SelectItem>
                {(Object.keys(ACTIVITY_ACTION_LABELS) as ActivityAction[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACTIVITY_ACTION_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={entityType}
              onValueChange={(value) => setEntityType(value as 'ALL' | ActivityEntityType)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {(Object.keys(ACTIVITY_ENTITY_LABELS) as ActivityEntityType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACTIVITY_ENTITY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        rowActions={(row) => [
          {
            label: 'View details',
            onClick: () => setDetailRow(row),
          },
        ]}
      />

      <ActivityDetailDialog
        open={detailRow !== null}
        row={detailRow}
        onClose={() => setDetailRow(null)}
      />
    </div>
  )
}
