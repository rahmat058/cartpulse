'use client'

import { toast } from 'sonner'
import type { OrderStatus } from '@/app/generated/prisma/client'
import { OrderDetailHeader } from '@/components/dashboard/OrderDetailHeader'
import { OrderStatusStepper } from '@/components/dashboard/OrderStatusStepper'
import { AdminOrderStatusActions } from '@/components/dashboard/AdminOrderStatusActions'
import { createContext, useCallback, useContext, useState, useTransition, type ReactNode } from 'react'

type OrderStatusContextValue = {
  status: OrderStatus
  pending: boolean
  updateStatus: (next: OrderStatus) => void
}

const OrderStatusContext = createContext<OrderStatusContextValue | null>(null)

function useOrderStatus() {
  const value = useContext(OrderStatusContext)
  if (!value) {
    throw new Error('useOrderStatus must be used within AdminOrderStatusProvider')
  }
  return value
}

export function AdminOrderStatusProvider({
  orderId,
  initialStatus,
  children,
}: {
  orderId: string
  initialStatus: OrderStatus
  children: ReactNode
}) {
  const [status, setStatus] = useState(initialStatus)
  const [pending, startTransition] = useTransition()

  const updateStatus = useCallback(
    (next: OrderStatus) => {
      setStatus((previous) => {
        startTransition(async () => {
          try {
            const response = await fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: next }),
            })
            if (!response.ok) {
              setStatus(previous)
              toast.error('Failed to update status')
              return
            }
            toast.success(`Order marked as ${next.toLowerCase()}`)
          } catch {
            setStatus(previous)
            toast.error('Failed to update status')
          }
        })
        return next
      })
    },
    [orderId],
  )

  return <OrderStatusContext.Provider value={{ status, pending, updateStatus }}>{children}</OrderStatusContext.Provider>
}

export function AdminOrderDetailHeaderLive({
  orderId,
  placedLabel,
  itemCount,
  totalLabel,
}: {
  orderId: string
  placedLabel: string
  itemCount: number
  totalLabel: string
}) {
  const { status } = useOrderStatus()
  return (
    <OrderDetailHeader
      orderId={orderId}
      status={status}
      placedLabel={placedLabel}
      itemCount={itemCount}
      totalLabel={totalLabel}
    />
  )
}

export function AdminOrderStatusStepperLive() {
  const { status } = useOrderStatus()
  return <OrderStatusStepper status={status} />
}

export function AdminOrderStatusActionsLive() {
  const { status, pending, updateStatus } = useOrderStatus()
  return <AdminOrderStatusActions status={status} pending={pending} onUpdate={updateStatus} />
}
