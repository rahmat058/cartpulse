'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { CouponForm } from '@/components/dashboard/CouponForm'

interface CouponDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  couponId?: string
  onClose: () => void
  onSuccess: () => void
}

function useLockPageScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const scrollY = window.scrollY
    const { style } = document.body

    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.left = '0'
    style.right = '0'
    style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      style.position = ''
      style.top = ''
      style.left = ''
      style.right = ''
      style.overflow = ''
      document.documentElement.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}

export function CouponDrawer({ open, mode, couponId, onClose, onSuccess }: CouponDrawerProps) {
  useLockPageScroll(open)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const title = mode === 'create' ? 'Add promo code' : 'Edit promo code'

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
            onWheel={(event) => event.preventDefault()}
            aria-label="Close promo code drawer"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 flex h-dvh max-h-dvh w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-950"
            aria-label={title}
            role="dialog"
            aria-modal="true"
          >
            <header className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                  <p className="text-xs text-slate-500">
                    {mode === 'create'
                      ? 'Create a discount code for checkout.'
                      : 'Update discount rules, limits, and availability.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
                  aria-label="Close promo code drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CouponForm
                key={mode === 'create' ? 'create-coupon' : couponId}
                couponId={mode === 'edit' ? couponId : undefined}
                variant="drawer"
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
