'use client'

import type { ComponentProps, ReactNode } from 'react'
import { StoreDrawer } from '@/components/admin/StoreDrawer'
import { createEntityDrawerProvider } from '@/lib/react/createEntityDrawerProvider'

const { Provider: BaseProvider, useEntityDrawer } = createEntityDrawerProvider<
  void,
  ComponentProps<typeof StoreDrawer>
>({
  hookName: 'useStoreDrawer',
  Drawer: StoreDrawer,
  toDrawerProps: (state, handlers) => ({
    open: true,
    mode: state.mode,
    storeId: state.mode === 'edit' ? state.entityId : undefined,
    onClose: handlers.onClose,
    onSuccess: handlers.onSuccess,
  }),
})

export function StoreDrawerProvider({
  children,
  onStoresChange,
}: {
  children: ReactNode
  onStoresChange?: () => void
}) {
  return <BaseProvider onChange={onStoresChange}>{children}</BaseProvider>
}

export const useStoreDrawer = useEntityDrawer
