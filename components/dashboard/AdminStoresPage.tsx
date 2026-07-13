'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { StoreLogoMark } from '@/components/shared/StoreLogoMark'
import { stripRichText } from '@/lib/utils/rich-text'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  StoreDrawerProvider,
  useStoreDrawer,
} from '@/components/providers/StoreDrawerProvider'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'

interface StoreRow {
  id: string
  slug: string
  name: string
  description?: string
  logoEmoji?: string
  logoUrl?: string | null
  productCount?: number
  verified?: boolean
  active?: boolean
}

export function AdminStoresPage() {
  const [refreshNonce, setRefreshNonce] = useState(0)

  return (
    <StoreDrawerProvider onStoresChange={() => setRefreshNonce((value) => value + 1)}>
      <AdminStoresPageContent refreshNonce={refreshNonce} />
    </StoreDrawerProvider>
  )
}

function AdminStoresPageContent({ refreshNonce }: { refreshNonce: number }) {
  const { openCreate, openEdit } = useStoreDrawer()
  const { confirmDelete } = useDeleteConfirm()
  const { can } = useAdminPermissions()
  const [stores, setStores] = useState<StoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const loadStores = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
    })
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`/api/admin/stores?${params}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load stores')
        return response.json() as Promise<{ data: StoreRow[]; total: number }>
      })
      .then((json) => {
        setStores(json.data ?? [])
        setTotal(json.total ?? 0)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, page, pageSize, status])

  useEffect(() => {
    loadStores()
  }, [loadStores, refreshNonce])

  const deleteStore = useCallback(async (store: StoreRow) => {
    const confirmed = await confirmDelete({
      entityName: store.name,
      description: 'Its products will also be removed from the storefront.',
    })
    if (!confirmed) return

    const response = await fetch(`/api/admin/stores/${store.id}`, { method: 'DELETE' })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(body.error ?? 'Failed to delete store')
      return
    }

    setStores((current) => current.filter((row) => row.id !== store.id))
    toast.success('Store deleted')
  }, [confirmDelete])

  const filtered = useMemo(() => stores, [stores])

  const columns = useMemo<ColumnDef<StoreRow>[]>(
    () => [
      {
        id: 'store',
        header: 'Store',
        accessorKey: 'name',
        cell: ({ row }) => (
          <button
            type="button"
            className="flex w-full items-center gap-3 text-left"
            onClick={() => openEdit(row.original.id)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-xl">
              <StoreLogoMark
                name={row.original.name}
                logoUrl={row.original.logoUrl}
                logoEmoji={row.original.logoEmoji ?? '🏪'}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">/{row.original.slug}</p>
            </div>
          </button>
        ),
      },
      {
        id: 'products',
        header: 'Products',
        accessorKey: 'productCount',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">{row.original.productCount ?? 0}</span>
        ),
      },
      {
        id: 'verified',
        header: 'Verified',
        accessorKey: 'verified',
        cell: ({ row }) => (
          <AdminStatusBadge variant={row.original.verified ? 'success' : 'muted'}>
            {row.original.verified ? 'Verified' : 'Unverified'}
          </AdminStatusBadge>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'active',
        cell: ({ row }) => (
          <AdminStatusBadge variant={row.original.active !== false ? 'success' : 'danger'}>
            {row.original.active !== false ? 'Active' : 'Inactive'}
          </AdminStatusBadge>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
            {row.original.description ? stripRichText(row.original.description) : '—'}
          </span>
        ),
      },
    ],
    [openEdit],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Stores"
        description="Each store owns its own product catalog with unique product slugs."
        action={
          can('create') ? (
            <Button onClick={() => openCreate()}>
              <Plus />
              Add store
            </Button>
          ) : undefined
        }
      />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        emptyMessage="No stores found. Add a store or run db:seed to populate demo data."
        searchPlaceholder="Search stores…"
        searchValue={search}
        onSearchChange={setSearch}
        manualPagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1)
          setPageSize(size)
        }}
        rowActions={(store) => [
          ...(can('update') ? [{ label: 'Edit store', onClick: () => openEdit(store.id) }] : []),
          {
            label: 'View storefront',
            onClick: () => window.open(`/stores/${store.slug}`, '_blank'),
          },
          {
            label: 'View products',
            onClick: () => window.location.assign(`/admin/products?storeId=${store.id}`),
          },
          ...(can('delete')
            ? [{
                label: 'Delete store',
                destructive: true,
                onClick: () => void deleteStore(store),
              }]
            : []),
        ]}
        filters={
          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1)
              setStatus((value ?? 'all') as typeof status)
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status">
                {status === 'all' ? 'All status' : status === 'active' ? 'Active' : 'Inactive'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        toolbarAction={
          <Link href="/stores" target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink />
              Storefront
            </Button>
          </Link>
        }
      />
    </div>
  )
}
