'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useCatalogFilters } from '@/hooks/use-catalog-filters'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types/cart'

type Suggestion = Pick<Product, 'id' | 'slug' | 'name' | 'emoji' | 'category'>

export function CatalogSearch() {
  const { query, setSearch } = useCatalogFilters()
  const listboxId = useId()
  const [value, setValue] = useState(query.search ?? '')
  const trimmedValue = value.trim()
  const debouncedValue = useDebouncedValue(trimmedValue, SEARCH_DEBOUNCE_MS)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setValue(query.search ?? '')
  }, [query.search])

  // Sync debounced text → URL (cursor catalog refetch via useCatalogLoader).
  useEffect(() => {
    const next = debouncedValue || undefined
    if ((query.search ?? undefined) === next) return
    setSearch(next)
  }, [debouncedValue, query.search, setSearch])

  useEffect(() => {
    if (trimmedValue.length < 2) {
      requestIdRef.current += 1
      setSuggestions([])
      setLoading(false)
      return
    }
    if (trimmedValue !== debouncedValue) {
      setSuggestions([])
      setLoading(true)
    }
  }, [trimmedValue, debouncedValue])

  // Suggestion dropdown — cursor-friendly first page only.
  useEffect(() => {
    if (debouncedValue.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    const controller = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(debouncedValue)}&sort=name-asc&pageSize=6`,
          { signal: controller.signal },
        )
        if (!response.ok || requestId !== requestIdRef.current) return
        const json = (await response.json()) as { data: Product[] }
        setSuggestions(json.data ?? [])
        setActiveIndex(-1)
      } catch {
        if (requestId === requestIdRef.current) setSuggestions([])
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [debouncedValue])

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index + 1) % Math.max(suggestions.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === 'Enter' && open && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      setValue(suggestions[activeIndex].name)
      setSearch(suggestions[activeIndex].name)
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        placeholder="Search products…"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
        }}
        onFocus={() => (suggestions.length > 0 || trimmedValue.length >= 2) && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="pl-9"
        aria-label="Search products"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        autoComplete="off"
      />

      {open && trimmedValue.length >= 2 && (loading || suggestions.length > 0) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border border-teal-100 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-950">
          {loading && (
            <li className="px-3 py-2 text-sm text-slate-400" role="presentation">
              Searching…
            </li>
          )}
          {!loading &&
            suggestions.map((item, index) => (
              <li key={item.id} id={`${listboxId}-option-${index}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                    index === activeIndex ? 'bg-teal-50 text-teal-800' : 'hover:bg-slate-50',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    setValue(item.name)
                    setSearch(item.name)
                    setOpen(false)
                  }}>
                  <span>{item.emoji}</span>
                  <span className="truncate">{item.name}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
