'use client'

import { cn } from '@/lib/utils/cn'
import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Truck, X } from 'lucide-react'
import { storefrontContainerClass } from '@/components/layout/StorefrontContainer'
import { StorageKeys, getStorageBoolean, setStorageBoolean } from '@/lib/storage/client-storage'

export function AnnouncementBar() {
  const t = useTranslations('announcement')
  const tCommon = useTranslations('common')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!getStorageBoolean(StorageKeys.hideAnnouncementBar))
  }, [])

  function dismiss() {
    setStorageBoolean(StorageKeys.hideAnnouncementBar, true)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="border-b border-teal-200/60 bg-linear-to-r from-teal-600 via-teal-500 to-cyan-500 text-white">
      <div className={cn(storefrontContainerClass, 'flex items-center gap-2 py-2')}>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xs font-medium sm:text-sm">
          <Truck className="hidden h-4 w-4 shrink-0 sm:block" />
          <span>{t('message')}</span>
          <Link href="/products?sort=price-desc" className="shrink-0 underline underline-offset-2 hover:text-teal-50">
            {tCommon('shopNow')}
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={t('dismiss')}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
