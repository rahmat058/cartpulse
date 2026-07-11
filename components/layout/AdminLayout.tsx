'use client'

import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Users,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UserAvatar } from '@/components/account/UserAvatar'
import { Sidebar, type SidebarNavItem } from '@/components/layout/Sidebar'
import { SidebarUserFooter } from '@/components/layout/SidebarUserFooter'
import { DeleteConfirmProvider } from '@/components/providers/DeleteConfirmProvider'
import { isSuperAdmin, isSuperAdminOnlyPath } from '@/lib/auth-access'

const NAV: SidebarNavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/coupons', label: 'Promo codes', icon: Tag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayoutShell({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode
  title?: string
  breadcrumbs?: string
}) {
  const { data: session } = useSession()
  const superAdmin = isSuperAdmin(session?.user?.role)
  const panelLabel = superAdmin ? 'Super Admin panel' : 'Admin panel'

  const navItems = useMemo(() => {
    const role = session?.user?.role
    if (isSuperAdmin(role)) return NAV
    return NAV.filter((item) => !isSuperAdminOnlyPath(item.href))
  }, [session?.user?.role])

  const panelBadge = superAdmin ? 'Super Admin' : 'Admin'

  return (
    <DeleteConfirmProvider>
      <div className="bg-muted/30 flex h-dvh overflow-hidden">
        <Sidebar
          title="CartPulse"
          items={navItems}
          badge={
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal-800 uppercase dark:bg-teal-900/50 dark:text-teal-200">
              {panelBadge}
            </span>
          }
          footer={<SidebarUserFooter />}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 z-20 shrink-0 border-b px-4 py-3.5 backdrop-blur md:px-8 md:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={cn(
                  breadcrumbs
                    ? 'text-muted-foreground text-sm'
                    : superAdmin
                      ? 'text-lg font-bold tracking-tight text-foreground md:text-xl'
                      : 'text-base font-bold tracking-tight text-foreground',
                )}>
                {breadcrumbs ?? panelLabel}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard"
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-md border border-teal-200 px-3.5 text-xs font-semibold text-teal-800',
                    'transition-colors hover:bg-teal-50 dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-950/40',
                  )}>
                  <UserAvatar
                    name={session?.user?.name}
                    email={session?.user?.email}
                    image={session?.user?.image}
                    size="xs"
                    className="ring-0"
                  />
                  My Account
                </Link>
                <Link
                  href="/"
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold text-white',
                    'bg-linear-to-r from-teal-500 via-teal-600 to-cyan-500',
                    'shadow-md shadow-teal-500/25 transition-all duration-300',
                    'hover:from-teal-600 hover:via-teal-700 hover:to-cyan-600 hover:shadow-lg hover:shadow-teal-500/35',
                    'dark:shadow-teal-500/15 dark:hover:shadow-teal-500/25',
                  )}>
                  View storefront
                  <ArrowUpRight className="size-3.5 opacity-90" aria-hidden />
                </Link>
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-8">{children}</main>
        </div>
      </div>
    </DeleteConfirmProvider>
  )
}
