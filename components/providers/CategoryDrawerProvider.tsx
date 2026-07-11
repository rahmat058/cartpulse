'use client'

import type { ComponentProps, ReactNode } from 'react'
import { CategoryDrawer } from '@/components/admin/CategoryDrawer'
import { createEntityDrawerProvider } from '@/lib/react/createEntityDrawerProvider'

const { Provider: BaseProvider, useEntityDrawer } = createEntityDrawerProvider<
  string | undefined,
  ComponentProps<typeof CategoryDrawer>
>({
  hookName: 'useCategoryDrawer',
  Drawer: CategoryDrawer,
  toDrawerProps: (state, handlers) => ({
    open: true,
    mode: state.mode,
    categoryId: state.mode === 'edit' ? state.entityId : undefined,
    defaultParentId: state.mode === 'create' ? state.defaults : undefined,
    onClose: handlers.onClose,
    onSuccess: handlers.onSuccess,
  }),
})

export function CategoryDrawerProvider({
  children,
  onCategoriesChange,
}: {
  children: ReactNode
  onCategoriesChange?: () => void
}) {
  return <BaseProvider onChange={onCategoriesChange}>{children}</BaseProvider>
}

export const useCategoryDrawer = useEntityDrawer
