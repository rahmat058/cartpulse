'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import {
  UserRoleDialog,
  adminPermissionsFromRow,
  defaultPermissionsForRole,
} from '@/components/admin/UserRoleDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SEARCH_DEBOUNCE_MS } from '@/lib/api/pagination'
import type { AdminPermissions, AppRole } from '@/types/auth'

interface UserRow {
  id: string
  name: string | null
  email: string
  role: AppRole
  permCreate: boolean
  permRead: boolean
  permUpdate: boolean
  permDelete: boolean
  createdAt: string
  _count: { orders: number }
}

function roleBadgeVariant(role: AppRole): 'warning' | 'violet' | 'teal' {
  if (role === 'SUPER_ADMIN') return 'violet'
  if (role === 'ADMIN') return 'warning'
  return 'teal'
}

function formatRoleLabel(role: AppRole) {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  if (role === 'ADMIN') return 'Admin'
  return 'Customer'
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [role, setRole] = useState<'ALL' | AppRole>('ALL')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [savingRole, setSavingRole] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [draftRole, setDraftRole] = useState<AppRole>('USER')
  const [draftPermissions, setDraftPermissions] = useState<AdminPermissions>(
    defaultPermissionsForRole('USER'),
  )
  const { confirmDelete } = useDeleteConfirm()
  const { isSuperAdmin } = useAdminPermissions()

  useEffect(() => {
    setPage(1)
  }, [role, debouncedSearch])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (role !== 'ALL') params.set('role', role)
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((json: { data: UserRow[]; total: number }) => {
        setUsers(json.data ?? [])
        setTotal(json.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [role, debouncedSearch, page, pageSize])

  const openRoleDialog = useCallback((user: UserRow) => {
    setEditingUser(user)
    setDraftRole(user.role)
    setDraftPermissions(adminPermissionsFromRow(user))
  }, [])

  const closeRoleDialog = useCallback(() => {
    if (savingRole) return
    setEditingUser(null)
  }, [savingRole])

  const saveRole = useCallback(async () => {
    if (!editingUser) return

    setSavingRole(true)
    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: draftRole,
        permissions: draftRole === 'ADMIN' ? draftPermissions : undefined,
      }),
    })
    const body = (await response.json()) as { data?: UserRow; error?: string }
    setSavingRole(false)

    if (!response.ok) {
      toast.error(body.error ?? 'Failed to update user role')
      return
    }

    if (body.data) {
      setUsers((current) => current.map((row) => (row.id === body.data!.id ? body.data! : row)))
    }
    toast.success('User access updated')
    setEditingUser(null)
  }, [draftPermissions, draftRole, editingUser])

  const deleteUser = useCallback(async (user: UserRow) => {
    const confirmed = await confirmDelete({
      entityName: user.email,
      description: 'Their order history will be kept, but they can no longer sign in.',
    })
    if (!confirmed) return

    const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(body.error ?? 'Failed to delete user')
      return
    }

    setUsers((current) => current.filter((row) => row.id !== user.id))
    toast.success('User deleted')
  }, [confirmDelete])

  const filtered = useMemo(() => users, [users])

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name ?? 'Unnamed user'}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
        cell: ({ row }) => (
          <AdminStatusBadge variant={roleBadgeVariant(row.original.role)}>
            {formatRoleLabel(row.original.role)}
          </AdminStatusBadge>
        ),
      },
      {
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => {
          if (row.original.role === 'SUPER_ADMIN') {
            return <span className="font-mono text-xs text-muted-foreground">CRUD</span>
          }

          if (row.original.role !== 'ADMIN') {
            return <span className="text-xs text-muted-foreground">—</span>
          }

          const labels = [
            row.original.permCreate && 'C',
            row.original.permRead && 'R',
            row.original.permUpdate && 'U',
            row.original.permDelete && 'D',
          ].filter(Boolean)

          return (
            <span className="font-mono text-xs text-muted-foreground">
              {labels.length > 0 ? labels.join('') : 'None'}
            </span>
          )
        },
      },
      {
        id: 'orders',
        header: 'Orders',
        accessorFn: (row) => row._count.orders,
        cell: ({ row }) => <span className="tabular-nums">{row.original._count.orders}</span>,
      },
      {
        id: 'joined',
        header: 'Joined',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Manage customer accounts, admin access, and granular permissions."
      />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No users found."
        searchPlaceholder="Search users…"
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
        rowActions={(user) => [
          { label: 'View orders', onClick: () => window.location.assign('/admin/orders') },
          ...(isSuperAdmin
            ? [{ label: 'Manage access', onClick: () => openRoleDialog(user) }]
            : []),
          ...(isSuperAdmin
            ? [{ label: 'Delete user', destructive: true, onClick: () => void deleteUser(user) }]
            : []),
        ]}
        filters={
          <Select
            value={role}
            onValueChange={(value) => {
              setPage(1)
              setRole((value ?? 'ALL') as typeof role)
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Role">
                {role === 'ALL'
                  ? 'All roles'
                  : role === 'USER'
                    ? 'Customers'
                    : role === 'ADMIN'
                      ? 'Admins'
                      : 'Super Admins'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="USER">Customers</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <UserRoleDialog
        open={Boolean(editingUser)}
        userEmail={editingUser?.email ?? ''}
        userName={editingUser?.name ?? null}
        role={draftRole}
        permissions={draftPermissions}
        saving={savingRole}
        onRoleChange={(nextRole) => {
          setDraftRole(nextRole)
          if (nextRole === 'ADMIN') {
            setDraftPermissions(defaultPermissionsForRole('ADMIN'))
          }
        }}
        onPermissionChange={(key, value) => {
          setDraftPermissions((current) => ({ ...current, [key]: value }))
        }}
        onCancel={closeRoleDialog}
        onSave={() => void saveRole()}
      />
    </div>
  )
}
