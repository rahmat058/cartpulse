'use client'

import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/app/generated/prisma/client'

const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Mark pending',
  PAID: 'Mark paid',
  SHIPPED: 'Mark shipped',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel order',
}

export function AdminOrderStatusActions({
  status,
  pending = false,
  onUpdate,
}: {
  status: OrderStatus
  pending?: boolean
  onUpdate: (next: OrderStatus) => void
}) {
  const nextStatuses = STATUSES.filter((value) => value !== status)

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'CANCELLED' ? 'destructive' : 'outline'}
          disabled={pending}
          className={
            next !== 'CANCELLED'
              ? 'border-teal-200 text-teal-800 hover:bg-teal-50 hover:text-teal-900 dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-950/40'
              : undefined
          }
          onClick={() => onUpdate(next)}
        >
          {STATUS_LABELS[next]}
        </Button>
      ))}
    </div>
  )
}
