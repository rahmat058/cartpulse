'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface AuthShellAsideItem {
  icon: LucideIcon
  label: string
}

interface AuthShellProps {
  title: string
  subtitle?: string
  asideTitle: string
  asideDescription: string
  asideItems: AuthShellAsideItem[]
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideDescription,
  asideItems,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-teal-500/10 lg:grid lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-950',
        className,
      )}>
      <aside className="hidden flex-col justify-between bg-linear-to-br from-slate-900 via-teal-950 to-cyan-900 p-8 text-white lg:flex">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-teal-300 uppercase">
            <ShoppingBag className="h-4 w-4" />
            CartPulse
          </Link>
          <h2 className="mt-6 text-3xl font-bold leading-tight">{asideTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{asideDescription}</p>
        </div>
        <ul className="space-y-4 text-sm text-teal-50">
          {asideItems.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <item.icon className="h-4 w-4 shrink-0 text-teal-300" />
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      <div className="p-6 sm:p-8">
        <div className="mb-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">
            <ShoppingBag className="h-3.5 w-3.5" />
            CartPulse
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  )
}
