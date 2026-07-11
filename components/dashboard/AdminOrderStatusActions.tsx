'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const router = useRouter()

  async function updateStatus(next: OrderStatus) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!response.ok) {
      toast.error('Failed to update status')
      return
    }
    toast.success(`Order marked as ${next.toLowerCase()}`)
    router.refresh()
  }

  const nextStatuses = STATUSES.filter((value) => value !== status)

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'CANCELLED' ? 'destructive' : 'outline'}
          className={
            next !== 'CANCELLED'
              ? 'border-teal-200 text-teal-800 hover:bg-teal-50 hover:text-teal-900 dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-950/40'
              : undefined
          }
          onClick={() => void updateStatus(next)}
        >
          {STATUS_LABELS[next]}
        </Button>
      ))}
    </div>
  )
}
