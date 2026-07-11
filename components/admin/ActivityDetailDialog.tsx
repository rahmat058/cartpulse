'use client'

import { createPortal } from 'react-dom'
import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Clock,
  Copy,
  FolderTree,
  Package,
  ScrollText,
  ShoppingBag,
  Store,
  Tag,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ActivityAction, ActivityEntityType, AdminActivityLogRow } from '@/types/activity'
import { ACTIVITY_ACTION_LABELS, ACTIVITY_ENTITY_LABELS, activityActionBadgeVariant } from '@/types/activity'

function actionIconStyles(action: ActivityAction) {
  if (action === 'CREATE') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  }
  if (action === 'UPDATE') {
    return 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200'
  }
  if (action === 'DELETE') {
    return 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
  }
  if (action === 'ROLE_CHANGE') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  }
  if (action === 'STATUS_CHANGE') {
    return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
  }
  return 'bg-muted text-muted-foreground'
}

const ENTITY_ICONS: Record<ActivityEntityType, LucideIcon> = {
  USER: Users,
  PRODUCT: Package,
  STORE: Store,
  CATEGORY: FolderTree,
  COUPON: Tag,
  ORDER: ShoppingBag,
  SYSTEM: ScrollText,
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMetadataLabel(key: string) {
  const labels: Record<string, string> = {
    published: 'Published',
    active: 'Active',
    status: 'Status',
    role: 'Role',
    permissions: 'Permissions',
  }
  if (labels[key]) return labels[key]
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
}

function formatMetadataValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') {
    if (key === 'published') return value ? 'Published' : 'Unpublished'
    if (key === 'active') return value ? 'Active' : 'Inactive'
    return value ? 'Yes' : 'No'
  }
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isSimpleMetadata(metadata: Record<string, unknown>) {
  return Object.values(metadata).every(
    (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value),
  )
}

function actorInitials(name: string | null, email: string) {
  const source = name?.trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function CopyIdButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [value])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-foreground shrink-0"
      onClick={handleCopy}
      aria-label="Copy entity ID">
      {copied ? <Check className="size-3.5 text-teal-600" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-border bg-muted/20 rounded-lg border p-4', className)}>
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function ActivityDetailDialog({
  open,
  row,
  onClose,
}: {
  open: boolean
  row: AdminActivityLogRow | null
  onClose: () => void
}) {
  const [showRawMetadata, setShowRawMetadata] = useState(false)

  if (typeof document === 'undefined') return null

  const EntityIcon = row ? ENTITY_ICONS[row.entityType] : ScrollText
  const simpleMetadata = row?.metadata && isSimpleMetadata(row.metadata)

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        setShowRawMetadata(false)
      }}>
      {open && row ? (
        <>
          <motion.button
            type="button"
            aria-label="Close activity details"
            className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-detail-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="border-border bg-card pointer-events-auto flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-xl">
              <div className="border-border border-b px-5 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-lg',
                      actionIconStyles(row.action),
                    )}>
                    <EntityIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="activity-detail-title" className="text-foreground text-base font-semibold">
                        Activity details
                      </h2>
                      <AdminStatusBadge variant={activityActionBadgeVariant(row.action)}>
                        {ACTIVITY_ACTION_LABELS[row.action]}
                      </AdminStatusBadge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{row.summary}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={onClose}
                    aria-label="Close">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <DetailSection title="Event">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge variant="muted">{ACTIVITY_ENTITY_LABELS[row.entityType]}</AdminStatusBadge>
                    {row.entityLabel ? (
                      <span className="text-foreground text-sm font-medium">{row.entityLabel}</span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                    <Clock className="size-4 shrink-0" />
                    <time dateTime={row.createdAt}>{formatTimestamp(row.createdAt)}</time>
                  </div>
                </DetailSection>

                <DetailSection title="Performed by">
                  {row.actor ? (
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
                        {actorInitials(row.actor.name, row.actor.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-foreground font-medium">{row.actor.name ?? 'Unnamed user'}</p>
                          <AdminStatusBadge variant={row.actor.role === 'SUPER_ADMIN' ? 'success' : 'warning'}>
                            {row.actor.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                          </AdminStatusBadge>
                        </div>
                        <p className="text-muted-foreground truncate text-sm">{row.actor.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Unknown admin</p>
                  )}
                </DetailSection>

                {row.entityId ? (
                  <DetailSection title="Reference">
                    <div className="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2">
                      <code className="text-foreground min-w-0 flex-1 truncate font-mono text-xs">{row.entityId}</code>
                      <CopyIdButton value={row.entityId} />
                    </div>
                  </DetailSection>
                ) : null}

                {row.metadata ? (
                  <DetailSection title="Changes">
                    {simpleMetadata && !showRawMetadata ? (
                      <dl className="space-y-2">
                        {Object.entries(row.metadata).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-background flex items-start justify-between gap-4 rounded-md px-3 py-2 text-sm">
                            <dt className="text-muted-foreground">{formatMetadataLabel(key)}</dt>
                            <dd className="text-foreground text-right font-medium">
                              {formatMetadataValue(key, value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <pre className="border-border bg-background text-foreground max-h-40 overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    )}
                    {!simpleMetadata || Object.keys(row.metadata).length > 3 ? (
                      <button
                        type="button"
                        className="mt-3 text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                        onClick={() => setShowRawMetadata((current) => !current)}>
                        {showRawMetadata ? 'Show formatted view' : 'View raw JSON'}
                      </button>
                    ) : null}
                  </DetailSection>
                ) : null}
              </div>

              <div className="border-border border-t px-5 py-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
