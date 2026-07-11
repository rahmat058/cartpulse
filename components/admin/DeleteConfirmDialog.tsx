'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function DeleteConfirmDialog({
  open,
  title,
  entityName,
  description,
  confirmLabel = 'Yes, delete',
  cancelLabel = 'No, cancel',
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title?: string
  entityName?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const heading =
    title ?? (entityName ? `Delete "${entityName}"?` : 'Delete this item?')

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[2px]"
            onClick={loading ? undefined : onCancel}
            aria-label="Close delete confirmation"
          />

          <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              aria-describedby="delete-confirm-description"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'pointer-events-auto w-full max-w-md rounded-md border border-border bg-card p-6 shadow-xl',
              )}
            >
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <AlertTriangle className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 id="delete-confirm-title" className="text-base font-semibold text-foreground">
                    {heading}
                  </h2>
                  <p id="delete-confirm-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="sm:min-w-28"
                  disabled={loading}
                  onClick={onCancel}
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:min-w-32"
                  loading={loading}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
