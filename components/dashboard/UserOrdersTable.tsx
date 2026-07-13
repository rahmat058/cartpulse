'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { AdminDataTable, type AdminRowAction } from '@/components/admin/AdminDataTable'
import { TableExportMenu } from '@/components/admin/TableExportMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Link, useRouter } from '@/i18n/navigation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'
import { formatCurrency } from '@/lib/utils/cartPricing'
import { mapUserOrderRowsForExport } from '@/lib/export/admin-table-rows'
import { orderStatusBadgeVariant } from '@/lib/orders/order-display'

type OrderRow = {
  id: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

/** Account orders — offset pagination + debounced search via GET /api/orders. */
export function UserOrdersTable() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number] | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((json: { data: OrderRow[]; total: number }) => {
        setOrders(json.data ?? [])
        setTotal(json.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, statusFilter, page, pageSize])

  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        id: 'orderId',
        header: 'Order ID',
        accessorKey: 'id',
        cell: ({ row }) => (
          <Link
            href={`/dashboard/orders/${row.original.id}`}
            className="break-all font-mono text-xs text-teal-700 hover:underline dark:text-teal-400"
            title={row.original.id}
          >
            {row.original.id}
          </Link>
        ),
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap text-sm">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy · h:mm aa')}
          </span>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        accessorKey: 'itemCount',
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">{row.original.itemCount}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <AdminStatusBadge variant={orderStatusBadgeVariant(row.original.status)}>
            {row.original.status}
          </AdminStatusBadge>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        accessorKey: 'total',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">{formatCurrency(row.original.total)}</span>
        ),
      },
    ],
    [],
  )

  const rowActions = useMemo(
    () =>
      (order: OrderRow): AdminRowAction<OrderRow>[] => [
        {
          label: 'View order',
          onClick: () => router.push(`/dashboard/orders/${order.id}`),
        },
      ],
    [router],
  )

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="My Orders"
        description="Track purchases and view order details"
        action={
          <TableExportMenu
            filenameBase="my-orders"
            sheetName="My Orders"
            page={page}
            rows={mapUserOrderRowsForExport(orders)}
            rowCount={orders.length}
            disabled={loading || orders.length === 0}
          />
        }
      />

      <AdminDataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No orders found."
        searchPlaceholder="Search by order ID…"
        searchValue={search}
        onSearchChange={setSearch}
        enableRowSelection={false}
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
        rowActions={rowActions}
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setPage(1)
              setStatusFilter((value ?? 'ALL') as typeof statusFilter)
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Status">
                {statusFilter === 'ALL' ? 'All status' : statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  )
}
