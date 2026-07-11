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

export function UserOrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number] | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = [...orders]

    if (statusFilter !== 'ALL') {
      result = result.filter((order) => order.status === statusFilter)
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (!query) return result
    return result.filter((order) => order.id.toLowerCase().includes(query))
  }, [orders, search, statusFilter])

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

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
            rows={mapUserOrderRowsForExport(paginatedOrders)}
            rowCount={paginatedOrders.length}
            disabled={paginatedOrders.length === 0}
          />
        }
      />

      <AdminDataTable
        columns={columns}
        data={paginatedOrders}
        emptyMessage="No orders found."
        searchPlaceholder="Search by order ID…"
        searchValue={search}
        onSearchChange={setSearch}
        enableRowSelection={false}
        enableSorting={false}
        manualPagination
        total={filtered.length}
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
