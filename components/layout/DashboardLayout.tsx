'use client'

import { Sidebar, type SidebarNavItem } from '@/components/layout/Sidebar'
import { SidebarUserFooter } from '@/components/layout/SidebarUserFooter'

const NAV: SidebarNavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/library', label: 'Library' },
  { href: '/dashboard/reviews', label: 'Reviews' },
]

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar title="My Account" items={NAV} footer={<SidebarUserFooter />} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 md:px-8">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
