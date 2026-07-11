'use client'

import type { ComponentProps, ReactNode } from 'react'
import { ProductDrawer } from '@/components/admin/ProductDrawer'
import { createEntityDrawerProvider } from '@/lib/react/createEntityDrawerProvider'

const { Provider: BaseProvider, useEntityDrawer } = createEntityDrawerProvider<
  string | undefined,
  ComponentProps<typeof ProductDrawer>
>({
  hookName: 'useProductDrawer',
  Drawer: ProductDrawer,
  toDrawerProps: (state, handlers) => ({
    open: true,
    mode: state.mode,
    productId: state.mode === 'edit' ? state.entityId : undefined,
    defaultStoreId: state.mode === 'create' ? state.defaults : undefined,
    onClose: handlers.onClose,
    onSuccess: handlers.onSuccess,
  }),
})

/** Provider + hook for admin product create/edit drawer (compound-component factory). */
export function ProductDrawerProvider({
  children,
  onProductsChange,
}: {
  children: ReactNode
  onProductsChange?: () => void
}) {
  return <BaseProvider onChange={onProductsChange}>{children}</BaseProvider>
}

export const useProductDrawer = useEntityDrawer
