import { auth } from '@/lib/auth'
import { NotificationsPanel } from '@/components/account/NotificationsPanel'
import {
  getUnreadNotificationCount,
  listUserNotifications,
} from '@/lib/services/notifications'

export default async function DashboardNotificationsPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [notifications, unreadCount] = userId
    ? await Promise.all([listUserNotifications(userId), getUnreadNotificationCount(userId)])
    : [[], 0]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">Order updates and account alerts</p>
      </div>
      <NotificationsPanel
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </div>
  )
}
