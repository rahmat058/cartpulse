'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter as useI18nRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types/cart'

type Suggestion = Pick<Product, 'id' | 'slug' | 'name' | 'emoji' | 'price' | 'category'>

export function HeaderSearch({ className }: { className?: string }) {
  const i18nRouter = useI18nRouter()
  const t = useTranslations('search')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(searchParams.get('search') ?? '')
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(searchParams.get('search') ?? '')
  }, [searchParams])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(debouncedQuery)}&sort=name-asc&pageSize=8`,
          { signal: controller.signal },
        )
        if (!response.ok) return
        const json = (await response.json()) as { data: Product[] }
        setSuggestions(
          (json.data ?? []).map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            emoji: product.emoji,
            price: product.price,
            category: product.category,
          })),
        )
        setActiveIndex(-1)
        setOpen(true)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSuggestions([])
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [debouncedQuery])

  function goToResults(value = query) {
    const trimmed = value.trim()
    const params = new URLSearchParams()
    if (trimmed) params.set('search', trimmed)
    setOpen(false)
    i18nRouter.push(params.toString() ? (`/products?${params}` as '/products') : '/products')
  }

  function selectSuggestion(item: Suggestion) {
    setQuery(item.name)
    setOpen(false)
    i18nRouter.push(`/products/${item.slug}` as '/products')
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length > 0) {
      setOpen(true)
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index + 1) % Math.max(suggestions.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault()
        selectSuggestion(suggestions[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        goToResults()
      }}
      className={cn('relative flex w-full max-w-xl', className)}
      role="search">
      <div className="relative flex w-full overflow-hidden rounded-md border border-teal-200/80 bg-white shadow-sm dark:border-teal-800 dark:bg-slate-900">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={onKeyDown}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-slate-400"
          aria-label={t('label')}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-linear-to-r from-teal-600 to-cyan-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">{tCommon('search')}</span>
        </button>
      </div>

      {open && query.trim().length >= 2 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 overflow-auto rounded-md border border-teal-100 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {loading && (
            <li className="px-4 py-3 text-sm text-slate-400" role="presentation">
              {t('searching')}
            </li>
          )}
          {!loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400" role="presentation">
              {t('noMatches', { query: query.trim() })}
            </li>
          )}
          {suggestions.map((item, index) => (
            <li key={item.id} id={`${listboxId}-option-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm',
                  index === activeIndex ? 'bg-teal-50 text-teal-800' : 'hover:bg-slate-50',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(item)}>
                <span className="text-lg">{item.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <span className="text-xs text-slate-400 capitalize">{item.category}</span>
              </button>
            </li>
          ))}
          {!loading && suggestions.length > 0 && (
            <li role="presentation" className="border-t border-slate-100">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-teal-700 hover:bg-teal-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goToResults()}>
                {t('seeAllResults', { query: query.trim() })}
              </button>
            </li>
          )}
        </ul>
      )}
    </form>
  )
}
