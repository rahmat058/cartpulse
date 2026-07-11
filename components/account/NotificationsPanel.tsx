'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Package, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'
import { Button } from '@/components/ui/Button'
import { useNotifications } from '@/hooks/use-notifications'
import type { UserNotification } from '@/lib/services/notifications'
import { cn } from '@/lib/utils/cn'

function notificationIcon(notification: UserNotification) {
  if (notification.title.toLowerCase().includes('shipped')) {
    return <Truck className="h-5 w-5" strokeWidth={1.75} />
  }
  if (notification.title.toLowerCase().includes('order')) {
    return <Package className="h-5 w-5" strokeWidth={1.75} />
  }
  return <Bell className="h-5 w-5" strokeWidth={1.75} />
}

export function NotificationsPanel({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: UserNotification[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const { notifications, unreadCount, refresh } = useNotifications()
  const [items, setItems] = useState(initialNotifications)
  const [unread, setUnread] = useState(initialUnreadCount)
  const [markingAll, setMarkingAll] = useState(false)

  const displayItems = notifications.length > 0 ? notifications : items
  const displayUnread = notifications.length > 0 ? unreadCount : unread

  async function markRead(notification: UserNotification) {
    if (notification.readAt) {
      if (notification.orderId) {
        router.push(`/dashboard/orders/${notification.orderId}`)
      }
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    )
    setUnread((count) => Math.max(0, count - 1))

    try {
      await fetch(`/api/notifications/${notification.id}`, { method: 'PATCH' })
      await refresh()
      if (notification.orderId) {
        router.push(`/dashboard/orders/${notification.orderId}`)
      }
    } catch {
      toast.error('Could not update notification')
      await refresh()
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH' })
      if (!response.ok) {
        toast.error('Could not mark notifications as read')
        return
      }
      setItems((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
      )
      setUnread(0)
      await refresh()
      toast.success('All notifications marked as read')
    } finally {
      setMarkingAll(false)
    }
  }

  if (displayItems.length === 0) {
    return (
      <AccountEmptyState
        title="You're all caught up"
        description="When there are shipping updates or account alerts, they will appear in this inbox."
        actionHref="/dashboard/orders"
        actionLabel="View orders"
        icon={<Bell className="h-9 w-9" strokeWidth={1.5} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {displayUnread > 0 ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={markingAll}
            onClick={() => void markAllRead()}
            className="border-teal-200 text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-200"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      ) : null}

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
        {displayItems.map((notification) => {
          const isUnread = !notification.readAt
          const content = (
            <div className="flex gap-4">
              <div
                className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  isUnread
                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}
              >
                {notificationIcon(notification)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={cn(
                      'text-sm',
                      isUnread
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'font-medium text-slate-700 dark:text-slate-300',
                    )}
                  >
                    {notification.title}
                  </p>
                  <time
                    dateTime={notification.createdAt}
                    className="shrink-0 text-xs text-slate-400"
                  >
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{notification.body}</p>
                {notification.orderId ? (
                  <p className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-400">
                    View order details →
                  </p>
                ) : null}
              </div>
              {isUnread ? (
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500"
                  aria-hidden
                />
              ) : null}
            </div>
          )

          return (
            <li key={notification.id}>
              {notification.orderId ? (
                <button
                  type="button"
                  onClick={() => void markRead(notification)}
                  className={cn(
                    'block w-full px-4 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60',
                    isUnread && 'bg-teal-50/40 dark:bg-teal-950/20',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={cn(
                    'px-4 py-4',
                    isUnread && 'bg-teal-50/40 dark:bg-teal-950/20',
                  )}
                >
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-center text-xs text-slate-400">
        Showing your {displayItems.length} most recent notification{displayItems.length === 1 ? '' : 's'}.
      </p>
    </div>
  )
}
