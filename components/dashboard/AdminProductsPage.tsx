'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminProductRow } from '@/types/admin'
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  ProductDrawerProvider,
  useProductDrawer,
} from '@/components/providers/ProductDrawerProvider'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { TableExportMenu } from '@/components/admin/TableExportMenu'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { mapProductRowsForExport } from '@/lib/export/admin-table-rows'

interface StoreOption {
  id: string
  name: string
}

export function AdminProductsPage() {
  const [refreshNonce, setRefreshNonce] = useState(0)

  return (
    <ProductDrawerProvider onProductsChange={() => setRefreshNonce((value) => value + 1)}>
      <AdminProductsPageContent refreshNonce={refreshNonce} />
    </ProductDrawerProvider>
  )
}

function AdminProductsPageContent({ refreshNonce }: { refreshNonce: number }) {
  const { openCreate, openEdit } = useProductDrawer()
  const { confirmDelete } = useDeleteConfirm()
  const { can } = useAdminPermissions()
  const [products, setProducts] = useState<AdminProductRow[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'price' | 'stock' | 'newest'>('newest')
  const [storeId, setStoreId] = useState('all')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('storeId') ?? params.get('store')
    if (id) setStoreId(id)
  }, [])

  useEffect(() => {
    fetch('/api/admin/stores')
      .then((r) => r.json())
      .then((json: { data: StoreOption[] }) => setStores(json.data ?? []))
      .catch(() => undefined)
  }, [])

  const loadProducts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
    })
    if (search.trim()) params.set('search', search.trim())
    if (storeId !== 'all') params.set('storeId', storeId)
    if (status === 'published') params.set('published', 'true')
    if (status === 'draft') params.set('published', 'false')

    fetch(`/api/admin/products?${params}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json()) as { error?: string }
          throw new Error(body.error ?? 'Failed to load products')
        }
        return response.json() as Promise<{ data: AdminProductRow[]; total: number }>
      })
      .then((json) => {
        setProducts(json.data)
        setTotal(json.total)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, pageSize, search, sort, storeId, status])

  useEffect(() => {
    loadProducts()
  }, [loadProducts, refreshNonce])

  const togglePublished = useCallback(async (product: AdminProductRow) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !product.published, publishedOnly: true }),
    })
    if (!response.ok) {
      toast.error('Failed to update publish state')
      return
    }
    const json = (await response.json()) as { data: AdminProductRow }
    setProducts((current) =>
      current.map((row) => (row.id === product.id ? { ...row, published: json.data.published } : row)),
    )
    toast.success(json.data.published ? 'Published' : 'Unpublished')
  }, [])

  const deleteProduct = useCallback(async (product: AdminProductRow) => {
    const confirmed = await confirmDelete({
      entityName: product.name,
      description: 'It will be removed from the storefront but kept for order history.',
    })
    if (!confirmed) return

    const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(body.error ?? 'Failed to delete product')
      return
    }

    toast.success('Product deleted')
    loadProducts()
  }, [confirmDelete, loadProducts])

  const columns = useMemo<ColumnDef<AdminProductRow>[]>(
    () => [
      {
        id: 'product',
        header: 'Product',
        accessorKey: 'name',
        cell: ({ row }) => {
          const product = row.original
          return (
            <button
              type="button"
              className="flex w-full items-center gap-3 text-left"
              onClick={() => openEdit(product.id)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-lg">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  product.emoji
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">{product.slug}</p>
              </div>
            </button>
          )
        },
      },
      {
        id: 'store',
        header: 'Store',
        accessorFn: (row) => row.store.name,
        cell: ({ row }) => (
          <AdminStatusBadge variant="teal">{row.original.store.name}</AdminStatusBadge>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) => row.category.name,
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">{row.original.category.name}</span>
        ),
      },
      {
        id: 'price',
        header: 'Amount',
        accessorKey: 'price',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">${row.original.price.toFixed(2)}</span>
        ),
      },
      {
        id: 'stock',
        header: 'QTY',
        accessorKey: 'stock',
        cell: ({ row }) => (
          <span
            className={
              row.original.stock <= 5 ? 'tabular-nums text-amber-600' : 'tabular-nums'
            }
          >
            {row.original.stock}
          </span>
        ),
      },
      {
        id: 'variants',
        header: 'Variants',
        accessorKey: 'variantCount',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.original.variantCount}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'published',
        enableSorting: false,
        cell: ({ row }) => (
          <button type="button" onClick={() => void togglePublished(row.original)}>
            <AdminStatusBadge variant={row.original.published ? 'success' : 'danger'}>
              {row.original.published ? 'Published' : 'Draft'}
            </AdminStatusBadge>
          </button>
        ),
      },
    ],
    [openEdit, togglePublished],
  )

  const storeLabel = useMemo(() => {
    if (storeId === 'all') return 'All stores'
    return stores.find((store) => store.id === storeId)?.name ?? 'Select store'
  }, [storeId, stores])

  const statusLabel =
    status === 'all' ? 'All status' : status === 'published' ? 'Published' : 'Draft'

  const sortLabel =
    sort === 'name' ? 'Name' : sort === 'price' ? 'Price' : sort === 'stock' ? 'Stock' : 'Newest'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Search, filter, publish, and edit products across all stores."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TableExportMenu
              filenameBase="products"
              sheetName="Products"
              page={page}
              rows={mapProductRowsForExport(products)}
              rowCount={products.length}
              disabled={loading || products.length === 0}
            />
            {can('create') ? (
              <Button onClick={() => openCreate(storeId !== 'all' ? storeId : undefined)}>
                <Plus />
                Add product
              </Button>
            ) : null}
          </div>
        }
      />

      <AdminDataTable
        columns={columns}
        data={products}
        loading={loading}
        error={error}
        emptyMessage="No products yet."
        searchPlaceholder="Search products…"
        searchValue={search}
        onSearchChange={(value) => {
          setPage(1)
          setSearch(value)
        }}
        enableSorting={false}
        manualPagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1)
          setPageSize(size)
        }}
        rowActions={(product) => [
          ...(can('update')
            ? [
                { label: 'Edit product', onClick: () => openEdit(product.id) },
                {
                  label: product.published ? 'Unpublish' : 'Publish',
                  onClick: () => void togglePublished(product),
                },
              ]
            : []),
          ...(can('delete')
            ? [{
                label: 'Delete product',
                destructive: true,
                onClick: () => void deleteProduct(product),
              }]
            : []),
        ]}
        filters={
          <>
            <Select value={storeId} onValueChange={(value) => { setPage(1); setStoreId(value ?? 'all') }}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Store">{storeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => { setPage(1); setStatus((value ?? 'all') as typeof status) }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status">{statusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort((value ?? 'name') as typeof sort)}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Sort">{sortLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />
    </div>
  )
}
