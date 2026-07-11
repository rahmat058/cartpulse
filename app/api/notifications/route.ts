import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getUnreadNotificationCount,
  listUserNotifications,
  markAllNotificationsRead,
} from '@/lib/services/notifications'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get('countOnly') === 'true'

  const unreadCount = await getUnreadNotificationCount(session.user.id)

  if (countOnly) {
    return NextResponse.json({ unreadCount })
  }

  const data = await listUserNotifications(session.user.id)
  return NextResponse.json({ data, unreadCount })
}

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await markAllNotificationsRead(session.user.id)
  return NextResponse.json({ ok: true })
}
