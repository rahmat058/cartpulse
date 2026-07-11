'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'

export type DeleteConfirmOptions = {
  title?: string
  entityName?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}

type PendingConfirm = DeleteConfirmOptions & {
  resolve: (value: boolean) => void
}

const DeleteConfirmContext = createContext<{
  confirmDelete: (options: DeleteConfirmOptions) => Promise<boolean>
} | null>(null)

export function DeleteConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)

  const confirmDelete = useCallback((options: DeleteConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const next = { ...options, resolve }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  const close = useCallback((result: boolean) => {
    pendingRef.current?.resolve(result)
    pendingRef.current = null
    setPending(null)
  }, [])

  useEffect(() => {
    if (!pending) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, pending])

  return (
    <DeleteConfirmContext.Provider value={{ confirmDelete }}>
      {children}
      <DeleteConfirmDialog
        open={Boolean(pending)}
        title={pending?.title}
        entityName={pending?.entityName}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        onCancel={() => close(false)}
        onConfirm={() => close(true)}
      />
    </DeleteConfirmContext.Provider>
  )
}

export function useDeleteConfirm() {
  const context = useContext(DeleteConfirmContext)
  if (!context) {
    throw new Error('useDeleteConfirm must be used within DeleteConfirmProvider')
  }
  return context
}
