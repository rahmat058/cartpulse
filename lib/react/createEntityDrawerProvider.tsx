'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ComponentType, type ReactNode } from 'react'

/**
 * Discriminated union for admin entity drawer state (create / edit / closed).
 * Compound-component pattern — one factory powers Product, Category, Store, Coupon drawers.
 */
export type EntityDrawerState<TCreateDefaults = void> =
  | { open: false }
  | { open: true; mode: 'create'; defaults?: TCreateDefaults }
  | { open: true; mode: 'edit'; entityId: string }

export interface EntityDrawerActions<TCreateDefaults = void> {
  openCreate: (defaults?: TCreateDefaults) => void
  openEdit: (entityId: string) => void
  close: () => void
}

interface CreateEntityDrawerProviderOptions<TCreateDefaults, TDrawerProps extends object> {
  /** Used in hook error messages, e.g. "useProductDrawer". */
  hookName: string
  Drawer: ComponentType<TDrawerProps>
  /** Map open drawer state + handlers into the mounted drawer component props. */
  toDrawerProps: (
    state: Extract<EntityDrawerState<TCreateDefaults>, { open: true }>,
    handlers: { onClose: () => void; onSuccess: () => void },
  ) => TDrawerProps
}

/**
 * Factory — creates a typed Provider + hook pair for admin CRUD drawers.
 * Eliminates four near-identical drawer provider implementations.
 */
export function createEntityDrawerProvider<TCreateDefaults = void, TDrawerProps extends object = object>(
  options: CreateEntityDrawerProviderOptions<TCreateDefaults, TDrawerProps>,
) {
  const Context = createContext<EntityDrawerActions<TCreateDefaults> | null>(null)

  function Provider({ children, onChange }: { children: ReactNode; onChange?: () => void }) {
    const [state, setState] = useState<EntityDrawerState<TCreateDefaults>>({ open: false })

    const openCreate = useCallback((defaults?: TCreateDefaults) => {
      setState({ open: true, mode: 'create', defaults })
    }, [])

    const openEdit = useCallback((entityId: string) => {
      setState({ open: true, mode: 'edit', entityId })
    }, [])

    const close = useCallback(() => {
      setState({ open: false })
    }, [])

    const handleSuccess = useCallback(() => {
      onChange?.()
      close()
    }, [close, onChange])

    const value = useMemo(() => ({ openCreate, openEdit, close }), [openCreate, openEdit, close])

    const drawerProps =
      state.open === true ? options.toDrawerProps(state, { onClose: close, onSuccess: handleSuccess }) : null

    return (
      <Context.Provider value={value}>
        {children}
        {drawerProps ? <options.Drawer {...drawerProps} /> : null}
      </Context.Provider>
    )
  }

  function useEntityDrawer(): EntityDrawerActions<TCreateDefaults> {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`${options.hookName} must be used within its Provider`)
    }
    return context
  }

  return { Provider, useEntityDrawer }
}
