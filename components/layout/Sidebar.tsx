'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SidebarNavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  title: string
  items: SidebarNavItem[]
  footer?: React.ReactNode
  badge?: React.ReactNode
}

function isNavItemActive(href: string, pathname: string, allHrefs: string[]): boolean {
  if (href === pathname) return true
  if (!pathname.startsWith(`${href}/`)) return false

  return !allHrefs.some(
    (other) =>
      other !== href &&
      other.startsWith(`${href}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  )
}

export function Sidebar({ title, items, footer, badge }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const hrefs = items.map((item) => item.href)

  const nav = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        {badge}
      </div>
      <nav className="mt-6 space-y-1" aria-label={title}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavItemActive(href, pathname, hrefs)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-teal-100 font-medium text-teal-900 dark:bg-teal-900/40 dark:text-teal-100'
                  : 'text-slate-600 hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
              {label}
            </Link>
          )
        })}
      </nav>
      {footer ? (
        <div className="mt-auto shrink-0 border-t border-slate-200 pt-4 dark:border-slate-700">{footer}</div>
      ) : null}
    </>
  )

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col overflow-hidden border-r border-border bg-card p-5 transition-transform md:static md:h-full md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {nav}
      </aside>
    </>
  )
}
