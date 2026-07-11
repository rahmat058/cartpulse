'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { TableExportMenu } from '@/components/admin/TableExportMenu'
import { DateRangePicker } from '@/components/ui/DatePicker'
import type { OrderStatus } from '@/app/generated/prisma/client'
import { mapOrderRowsForExport } from '@/lib/export/admin-table-rows'
import { orderStatusBadgeVariant } from '@/lib/orders/order-display'
import { AdminDataTable, type AdminRowAction } from '@/components/admin/AdminDataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

interface OrderRow {
  id: string
  status: OrderStatus
  total: number
  createdAt: string
  user: { name: string | null; email: string }
}

const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [filter, search, dateFrom, dateTo])

  useEffect(() => {
    setLoading(true)
    const url = filter === 'ALL' ? '/api/orders' : `/api/orders?status=${filter}`
    fetch(url)
      .then((r) => r.json())
      .then((json: { data: OrderRow[] }) => setOrders(json.data ?? []))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = [...orders]

    if (dateFrom || dateTo) {
      result = result.filter((order) => {
        const orderDate = format(new Date(order.createdAt), 'yyyy-MM-dd')
        if (dateFrom && orderDate < dateFrom) return false
        if (dateTo && orderDate > dateTo) return false
        return true
      })
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (!query) return result
    return result.filter(
      (order) =>
        order.user.email.toLowerCase().includes(query) ||
        (order.user.name?.toLowerCase().includes(query) ?? false) ||
        order.id.toLowerCase().includes(query),
    )
  }, [orders, search, dateFrom, dateTo])

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      toast.error('Failed to update status')
      return
    }
    const json = (await response.json()) as { data: OrderRow }
    setOrders((current) => current.map((o) => (o.id === id ? { ...o, status: json.data.status } : o)))
    toast.success('Order updated')
  }, [])

  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        id: 'customer',
        header: 'Customer',
        accessorFn: (row) => row.user.name ?? row.user.email,
        cell: ({ row }) => (
          <Link href={`/admin/orders/${row.original.id}`} className="text-primary font-medium hover:underline">
            {row.original.user.name ?? row.original.user.email}
          </Link>
        ),
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span>
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
        cell: ({ row }) => <span className="font-medium tabular-nums">${row.original.total.toFixed(2)}</span>,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Track order status and update fulfillment from one place."
        action={
          <TableExportMenu
            filenameBase="orders"
            sheetName="Orders"
            page={page}
            rows={mapOrderRowsForExport(paginatedOrders)}
            rowCount={paginatedOrders.length}
            disabled={loading || paginatedOrders.length === 0}
          />
        }
      />

      <AdminDataTable
        columns={columns}
        data={paginatedOrders}
        loading={loading}
        emptyMessage="No orders found."
        searchPlaceholder="Search orders…"
        searchValue={search}
        onSearchChange={setSearch}
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
        rowActions={(order) => {
          const nextStatuses = STATUSES.filter((status) => status !== order.status)
          const fulfillment = nextStatuses.filter((status) => status !== 'CANCELLED')
          const actions: AdminRowAction<OrderRow>[] = fulfillment.map((status) => ({
            label: `Mark ${status.toLowerCase()}`,
            onClick: () => void updateStatus(order.id, status),
          }))

          if (nextStatuses.includes('CANCELLED')) {
            actions.push({
              label: 'Mark cancelled',
              destructive: true,
              onClick: () => void updateStatus(order.id, 'CANCELLED'),
            })
          }

          return actions
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filter}
              onValueChange={(value) => {
                setPage(1)
                setFilter((value ?? 'ALL') as typeof filter)
              }}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Status">{filter === 'ALL' ? 'All status' : filter}</SelectValue>
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
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={({ from, to }) => {
                setPage(1)
                setDateFrom(from)
                setDateTo(to)
              }}
              className="w-[15rem]"
            />
          </div>
        }
      />
    </div>
  )
}
