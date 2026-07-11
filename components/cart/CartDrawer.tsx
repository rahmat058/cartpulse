'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { clearCart } from '@/lib/store/slices/cartSlice'
import { selectCartItemCount } from '@/lib/store/selectors/cartSelectors'
import { CartContent } from '@/components/cart/CartContent'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const dispatch = useAppDispatch()
  const itemCount = useAppSelector(selectCartItemCount)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Close cart"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950"
            aria-label="Shopping cart"
            role="dialog"
            aria-modal="true">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Cart</h2>
                {itemCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {itemCount > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(clearCart())}
                    className="rounded px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
                  aria-label="Close cart drawer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <CartContent variant="drawer" onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
