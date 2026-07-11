'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { DEFAULT_ADMIN_PERMISSIONS, type AdminPermissions, type AppRole } from '@/types/auth'

const PERMISSION_LABELS: Array<{ key: keyof AdminPermissions; label: string }> = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
]

export function UserRoleDialog({
  open,
  userEmail,
  userName,
  role,
  permissions,
  saving,
  onRoleChange,
  onPermissionChange,
  onCancel,
  onSave,
}: {
  open: boolean
  userEmail: string
  userName: string | null
  role: AppRole
  permissions: AdminPermissions
  saving?: boolean
  onRoleChange: (role: AppRole) => void
  onPermissionChange: (key: keyof AdminPermissions, value: boolean) => void
  onCancel: () => void
  onSave: () => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close role dialog"
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-role-dialog-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto w-full max-w-md rounded-md border border-border bg-card p-5 shadow-xl"
            >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200">
                <Shield className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 id="user-role-dialog-title" className="text-base font-semibold text-foreground">
                  Manage access
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {userName ?? 'Unnamed user'} · {userEmail}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                <Select value={role} onValueChange={(value) => onRoleChange((value ?? 'USER') as AppRole)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Customer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'ADMIN' ? (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Admin permissions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Defaults: create, read, update. Grant delete only when needed.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {PERMISSION_LABELS.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox
                          checked={permissions[key]}
                          onCheckedChange={(checked) => onPermissionChange(key, checked === true)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {role === 'SUPER_ADMIN' ? (
                <p className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Super admins have full access to all admin areas, including users, analytics, and settings.
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export function adminPermissionsFromRow(user: {
  permCreate: boolean
  permRead: boolean
  permUpdate: boolean
  permDelete: boolean
}): AdminPermissions {
  return {
    create: user.permCreate,
    read: user.permRead,
    update: user.permUpdate,
    delete: user.permDelete,
  }
}

export function defaultPermissionsForRole(role: AppRole): AdminPermissions {
  if (role === 'ADMIN') return { ...DEFAULT_ADMIN_PERMISSIONS }
  return { create: false, read: false, update: false, delete: false }
}
