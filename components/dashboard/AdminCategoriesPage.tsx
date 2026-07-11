'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCategoryTree } from '@/components/admin/AdminCategoryTree'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import type { AdminCategoryTreeNode } from '@/types/admin'
import {
  CategoryDrawerProvider,
  useCategoryDrawer,
} from '@/components/providers/CategoryDrawerProvider'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'

export function AdminCategoriesPage() {
  const [refreshNonce, setRefreshNonce] = useState(0)

  return (
    <CategoryDrawerProvider onCategoriesChange={() => setRefreshNonce((value) => value + 1)}>
      <AdminCategoriesPageContent refreshNonce={refreshNonce} />
    </CategoryDrawerProvider>
  )
}

function AdminCategoriesPageContent({ refreshNonce }: { refreshNonce: number }) {
  const { openCreate, openEdit } = useCategoryDrawer()
  const { confirmDelete } = useDeleteConfirm()
  const { can } = useAdminPermissions()
  const [tree, setTree] = useState<AdminCategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadCategories = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/categories?tree=true')
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load categories')
        return response.json() as Promise<{ data: AdminCategoryTreeNode[] }>
      })
      .then((json) => setTree(json.data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories, refreshNonce])

  const deleteCategory = useCallback(async (category: AdminCategoryTreeNode) => {
    const confirmed = await confirmDelete({
      entityName: category.name,
      description:
        'All nested subcategories and related products will be removed from the storefront.',
    })
    if (!confirmed) return

    const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(body.error ?? 'Failed to delete category')
      return
    }

    toast.success('Category deleted')
    loadCategories()
  }, [confirmDelete, loadCategories])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Manage a 3-level category tree for navigation, filters, and product assignment."
        action={
          can('create') ? (
            <Button onClick={() => openCreate()}>
              <Plus />
              Add category
            </Button>
          ) : undefined
        }
      />

      <AdminCategoryTree
        tree={tree}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        onEdit={openEdit}
        onDelete={deleteCategory}
        onAddRoot={() => openCreate()}
        onAddChild={(parentId) => openCreate(parentId)}
        canDelete={can('delete')}
        canCreate={can('create')}
      />
    </div>
  )
}
