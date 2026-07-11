'use client'

import { useState } from 'react'
import { Check, Copy, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderStatus } from '@/app/generated/prisma/client'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { DownloadOrderPdfButton } from '@/components/dashboard/DownloadOrderPdfButton'
import { orderStatusBadgeVariant } from '@/lib/orders/order-display'
import { cn } from '@/lib/utils'

function CopyOrderIdButton({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderId)
      setCopied(true)
      toast.success('Order ID copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy order ID')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-background p-1.5',
        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40',
      )}
      aria-label="Copy order ID"
    >
      {copied ? <Check className="size-3.5 text-teal-600" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function OrderDetailHeader({
  orderId,
  status,
  placedLabel,
  itemCount,
  totalLabel,
}: {
  orderId: string
  status: OrderStatus
  placedLabel: string
  itemCount: number
  totalLabel: string
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-teal-100/80 bg-linear-to-br from-teal-50/70 via-white to-cyan-50/40 p-5 shadow-sm',
        'dark:border-teal-900/40 dark:from-teal-950/25 dark:via-card dark:to-cyan-950/15',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/20">
              <Receipt className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Order details
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {placedLabel}
                <span className="mx-2 text-border">·</span>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <AdminStatusBadge variant={orderStatusBadgeVariant(status)} className="ml-auto sm:ml-0">
              {status}
            </AdminStatusBadge>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Order ID
            </p>
            <div className="flex max-w-full items-start gap-2 rounded-md border border-border/70 bg-background/90 px-3 py-2.5 shadow-xs">
              <p className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
                <span className="font-semibold text-teal-700 dark:text-teal-300">Order#</span>
                {orderId}
              </p>
              <CopyOrderIdButton orderId={orderId} />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[180px] sm:items-stretch">
          <DownloadOrderPdfButton orderId={orderId} />
          <div className="rounded-md border border-teal-100 bg-background/90 px-4 py-3 text-right shadow-xs dark:border-teal-900/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Order total
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-teal-700 dark:text-teal-300">
              {totalLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
