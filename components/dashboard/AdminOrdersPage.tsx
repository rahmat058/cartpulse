'use client'

import Link from 'next/link'
import { toast } from 'sonner'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [filter, debouncedSearch, dateFrom, dateTo])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (filter !== 'ALL') params.set('status', filter)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((json: { data: OrderRow[]; total: number }) => {
        setOrders(json.data ?? [])
        setTotal(json.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [filter, debouncedSearch, dateFrom, dateTo, page, pageSize])

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
            rows={mapOrderRowsForExport(orders)}
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
        searchPlaceholder="Search orders…"
        searchValue={search}
        onSearchChange={setSearch}
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
