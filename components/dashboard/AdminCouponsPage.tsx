'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { Button } from '@/components/ui/Button'
import type { AdminCouponRow } from '@/lib/services/admin-coupons'
import { formatDateTimeDisplay } from '@/lib/utils/datetime-picker'
import {
  CouponDrawerProvider,
  useCouponDrawer,
} from '@/components/providers/CouponDrawerProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'

function formatDiscount(coupon: AdminCouponRow) {
  if (coupon.type === 'PERCENT') return `${Math.round(coupon.value * 1000) / 10}% off`
  if (coupon.type === 'SHIPPING') return 'Free shipping'
  return `$${coupon.value.toFixed(2)} off`
}

function couponIsExpired(coupon: AdminCouponRow) {
  if (!coupon.endsAt) return false
  return new Date(coupon.endsAt) < new Date()
}

export function AdminCouponsPage() {
  const [refreshNonce, setRefreshNonce] = useState(0)

  return (
    <CouponDrawerProvider onCouponsChange={() => setRefreshNonce((value) => value + 1)}>
      <AdminCouponsPageContent refreshNonce={refreshNonce} />
    </CouponDrawerProvider>
  )
}

function AdminCouponsPageContent({ refreshNonce }: { refreshNonce: number }) {
  const { openCreate, openEdit } = useCouponDrawer()
  const { confirmDelete } = useDeleteConfirm()
  const { can } = useAdminPermissions()
  const [coupons, setCoupons] = useState<AdminCouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const loadCoupons = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
    })
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`/api/admin/coupons?${params}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load promo codes')
        return response.json() as Promise<{ data: AdminCouponRow[]; total: number }>
      })
      .then((json) => {
        setCoupons(json.data ?? [])
        setTotal(json.total ?? 0)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, page, pageSize, status])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons, refreshNonce])

  const toggleActive = useCallback(async (coupon: AdminCouponRow) => {
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active, activeOnly: true }),
    })
    if (!response.ok) {
      toast.error('Failed to update promo code')
      return
    }
    const json = (await response.json()) as { data: AdminCouponRow }
    setCoupons((current) => current.map((row) => (row.id === coupon.id ? json.data : row)))
    toast.success(json.data.active ? 'Promo code activated' : 'Promo code deactivated')
  }, [])

  const deleteCoupon = useCallback(async (coupon: AdminCouponRow) => {
    const confirmed = await confirmDelete({
      entityName: coupon.code,
      description: 'It will no longer be available at checkout.',
    })
    if (!confirmed) return

    const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(body.error ?? 'Failed to delete promo code')
      return
    }

    setCoupons((current) => current.filter((row) => row.id !== coupon.id))
    toast.success('Promo code deleted')
  }, [confirmDelete])

  const filtered = useMemo(() => coupons, [coupons])

  const columns = useMemo<ColumnDef<AdminCouponRow>[]>(
    () => [
      {
        id: 'code',
        header: 'Code',
        accessorKey: 'code',
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left"
            onClick={() => openEdit(row.original.id)}
          >
            <p className="font-mono font-semibold tracking-wide text-foreground">{row.original.code}</p>
            <p className="text-xs text-muted-foreground">{row.original.label}</p>
          </button>
        ),
      },
      {
        id: 'discount',
        header: 'Discount',
        accessorKey: 'value',
        cell: ({ row }) => <span className="font-medium">{formatDiscount(row.original)}</span>,
      },
      {
        id: 'min',
        header: 'Min subtotal',
        accessorKey: 'minSubtotal',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.minSubtotal != null ? `$${row.original.minSubtotal.toFixed(2)}` : '—'}
          </span>
        ),
      },
      {
        id: 'uses',
        header: 'Uses',
        accessorKey: 'usedCount',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.usedCount}
            {row.original.maxUses != null ? ` / ${row.original.maxUses}` : ''}
          </span>
        ),
      },
      {
        id: 'starts',
        header: 'Starts',
        accessorKey: 'startsAt',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.startsAt ? formatDateTimeDisplay(row.original.startsAt) : '—'}
          </span>
        ),
      },
      {
        id: 'expires',
        header: 'Expires',
        accessorKey: 'endsAt',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.endsAt ? formatDateTimeDisplay(row.original.endsAt) : 'Never'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'active',
        enableSorting: false,
        cell: ({ row }) => {
          const coupon = row.original
          const expired = couponIsExpired(coupon)
          const variant = !coupon.active ? 'danger' : expired ? 'warning' : 'success'
          const label = !coupon.active ? 'Inactive' : expired ? 'Expired' : 'Active'
          return (
            <button type="button" onClick={() => void toggleActive(coupon)}>
              <AdminStatusBadge variant={variant}>{label}</AdminStatusBadge>
            </button>
          )
        },
      },
    ],
    [openEdit, toggleActive],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promo codes"
        description="Manage discount codes shown at checkout and track usage limits."
        action={
          can('create') ? (
            <Button onClick={() => openCreate()}>
              <Plus />
              Add promo code
            </Button>
          ) : undefined
        }
      />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        emptyMessage="No promo codes yet. Add one or seed the database to add demo coupons."
        searchPlaceholder="Search promo codes…"
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
        rowActions={(coupon) => [
          ...(can('update')
            ? [
                { label: 'Edit promo code', onClick: () => openEdit(coupon.id) },
                {
                  label: coupon.active ? 'Deactivate' : 'Activate',
                  onClick: () => void toggleActive(coupon),
                },
              ]
            : []),
          ...(can('delete')
            ? [{
                label: 'Delete promo code',
                destructive: true,
                onClick: () => void deleteCoupon(coupon),
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
      />
    </div>
  )
}
