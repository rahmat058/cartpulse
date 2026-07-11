'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Shield,
  UserRound,
  X,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useWishlist } from '@/hooks/use-wishlist'
import { useNotifications } from '@/hooks/use-notifications'
import { isAdminPanelUser } from '@/lib/auth-access'
import { UserAvatar } from '@/components/account/UserAvatar'
import { cn, firstNameFrom } from '@/lib/utils/cn'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  exact?: boolean
}

export function AccountSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { count: wishlistCount } = useWishlist()
  const { unreadCount: notificationCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const user = session?.user
  const isAdmin = isAdminPanelUser(user?.role)

  const nav: NavItem[] = [
    { href: '/dashboard/orders', label: 'My Orders', icon: Package },
    { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { href: '/dashboard/reviews', label: 'My Reviews', icon: MessageSquare },
    { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
    { href: '/dashboard/profile', label: 'Profile', icon: UserRound },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { href: '/dashboard/settings', label: 'Settings', icon: Shield },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
  ]

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  const body = (
    <div className="flex h-full flex-col">
      <div className="rounded-md border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <UserAvatar name={user?.name} email={user?.email} image={user?.image} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {firstNameFrom(user?.name, user?.email)}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 space-y-1" aria-label="My Account">
        {nav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                  : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {isAdmin ? (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="flex-1">Admin panel</span>
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>
    </div>
  )

  return (
    <div className="min-w-0 lg:w-full">
      <button
        type="button"
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close account menu' : 'Open account menu'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[280px] overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-950 lg:static lg:h-fit lg:w-full lg:translate-x-0 lg:rounded-md lg:border lg:border-slate-200/80 lg:bg-white/90 lg:shadow-sm dark:lg:border-slate-800 dark:lg:bg-slate-950/80',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {body}
      </aside>
    </div>
  )
}
