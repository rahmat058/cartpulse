'use client'

import type { ComponentProps, ReactNode } from 'react'
import { CouponDrawer } from '@/components/admin/CouponDrawer'
import { createEntityDrawerProvider } from '@/lib/react/createEntityDrawerProvider'

const { Provider: BaseProvider, useEntityDrawer } = createEntityDrawerProvider<
  void,
  ComponentProps<typeof CouponDrawer>
>({
  hookName: 'useCouponDrawer',
  Drawer: CouponDrawer,
  toDrawerProps: (state, handlers) => ({
    open: true,
    mode: state.mode,
    couponId: state.mode === 'edit' ? state.entityId : undefined,
    onClose: handlers.onClose,
    onSuccess: handlers.onSuccess,
  }),
})

export function CouponDrawerProvider({
  children,
  onCouponsChange,
}: {
  children: ReactNode
  onCouponsChange?: () => void
}) {
  return <BaseProvider onChange={onCouponsChange}>{children}</BaseProvider>
}

export const useCouponDrawer = useEntityDrawer
