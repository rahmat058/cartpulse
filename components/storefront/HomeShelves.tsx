'use client'

import { cn } from '@/lib/utils/cn'
import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProductMarquee } from '@/components/storefront/ProductMarquee'
import { ProductShelfGrid } from '@/components/storefront/ProductShelfGrid'
import { FeaturedStoresGrid } from '@/components/storefront/FeaturedStoresGrid'
import { ShelfSeeAllLink } from '@/components/storefront/ShelfSeeAllLink'
import { useShelfItemLimit } from '@/hooks/use-shelf-item-limit'
import { StorageKeys, getStorageJSON, setStorageJSON } from '@/lib/storage/client-storage'
import type { HomeShelfPayload, ProductShelfPayload } from '@/lib/commerce/HomeShelfStrategy'
import type { Product } from '@/types/cart'

export function readRecentlyViewed(): string[] {
  const parsed = getStorageJSON<string[]>(StorageKeys.recentlyViewed, [])
  return Array.isArray(parsed) ? parsed : []
}

export function pushRecentlyViewed(productId: string) {
  const next = [productId, ...readRecentlyViewed().filter((id) => id !== productId)].slice(0, 12)
  setStorageJSON(StorageKeys.recentlyViewed, next)
}

function ShelfHeader({
  title,
  subtitle,
  href,
  titleClassName,
}: {
  title: string
  subtitle?: string
  href?: string
  titleClassName?: string
}) {
  const t = useTranslations('common')

  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className={cn('text-xl font-bold text-slate-900 dark:text-slate-100', titleClassName)}>{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href as '/products'}
          className="shrink-0 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
          {t('seeAll')}
        </Link>
      ) : null}
    </div>
  )
}

function FeaturedStoresSection({ shelf }: { shelf: Extract<HomeShelfPayload, { type: 'stores' }> }) {
  return (
    <section>
      <ShelfHeader
        title={shelf.title}
        subtitle={shelf.subtitle}
        titleClassName={shelf.titleClassName}
        href={shelf.href}
      />
      <FeaturedStoresGrid stores={shelf.stores} seeAllHref={shelf.href} />
    </section>
  )
}

function ProductShelfSection({ shelf }: { shelf: ProductShelfPayload }) {
  const t = useTranslations('common')
  const useMarquee = shelf.kind === 'recently-ordered'
  const limit = useShelfItemLimit()
  const visibleProducts = shelf.products.slice(0, limit)
  const hasMore = shelf.products.length > limit

  return (
    <section>
      <ShelfHeader
        title={shelf.title}
        subtitle={shelf.subtitle}
        href={shelf.href}
        titleClassName={shelf.titleClassName}
      />
      {useMarquee ? (
        <>
          <ProductMarquee products={visibleProducts} />
          {hasMore && shelf.href ? <ShelfSeeAllLink href={shelf.href} label={t('seeAllOrders')} /> : null}
        </>
      ) : (
        <ProductShelfGrid products={shelf.products} seeAllHref={shelf.href} />
      )}
    </section>
  )
}

function RecentlyViewedShelf({ fallback, meta }: { fallback: Product[]; meta: ProductShelfPayload }) {
  const [products, setProducts] = useState<Product[]>(fallback)

  useEffect(() => {
    const ids = readRecentlyViewed()
    if (ids.length === 0) return

    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(`/api/products?ids=${ids.join(',')}`)
        if (!response.ok || cancelled) return
        const json = (await response.json()) as { data: Product[] }
        if (!cancelled && json.data?.length) {
          const byId = Object.fromEntries(json.data.map((p) => [p.id, p]))
          setProducts(ids.map((id) => byId[id]).filter(Boolean))
        }
      } catch {
        // keep fallback
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (products.length === 0) return null

  return (
    <section>
      <ShelfHeader title={meta.title} subtitle={meta.subtitle} titleClassName={meta.titleClassName} href={meta.href} />
      <ProductShelfGrid products={products} seeAllHref={meta.href} />
    </section>
  )
}

export function HomeShelves({ shelves }: { shelves: HomeShelfPayload[] }) {
  return (
    <div className="space-y-12">
      {shelves.map((shelf) => {
        if (shelf.type === 'stores') {
          return <FeaturedStoresSection key={shelf.kind} shelf={shelf} />
        }

        if (shelf.kind === 'recently-viewed') {
          return <RecentlyViewedShelf key={shelf.kind} fallback={shelf.products} meta={shelf} />
        }

        return <ProductShelfSection key={shelf.kind} shelf={shelf} />
      })}
    </div>
  )
}
