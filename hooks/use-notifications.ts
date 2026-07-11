'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { UserNotification } from '@/lib/services/notifications'

export function useNotifications() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(false)

  const authenticated = status === 'authenticated' && Boolean(session?.user?.id)

  const refresh = useCallback(async () => {
    if (!authenticated) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) return
      const json = (await response.json()) as {
        data?: UserNotification[]
        unreadCount?: number
      }
      setNotifications(json.data ?? [])
      setUnreadCount(json.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }, [authenticated])

  useEffect(() => {
    if (status === 'loading') return
    if (!authenticated) {
      setUnreadCount(0)
      setNotifications([])
      return
    }
    void refresh()
  }, [authenticated, pathname, refresh, status])

  return { unreadCount, notifications, loading, refresh, authenticated }
}
