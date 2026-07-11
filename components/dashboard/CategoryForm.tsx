'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminCategoryRow, CreateCategoryInput, UpdateCategoryInput } from '@/types/admin'
import { Button } from '@/components/ui/Button'
import { CategoryTreeSelect } from '@/components/ui/CategoryTreeSelect'
import { Input } from '@/components/ui/Input'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { useAdminPermissions } from '@/hooks/use-admin-permissions'
import {
  categoryFormSchema,
  DEFAULT_CATEGORY_FORM_VALUES,
  type CategoryFormValues,
} from '@/lib/validations/category'

function Field({
  label,
  required,
  error,
  children,
  htmlFor,
  hint,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  htmlFor?: string
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toPayload(values: CategoryFormValues): CreateCategoryInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim() || slugify(values.name),
    description: values.description?.trim() || undefined,
    emoji: values.emoji?.trim() || '📦',
    sortOrder: Number(values.sortOrder),
    parentId: values.parentId?.trim() ? values.parentId.trim() : null,
  }
}

interface ParentOption {
  id: string
  name: string
  slug: string
  depth: number
  emoji: string | null
  label: string
}

export function CategoryForm({
  categoryId,
  defaultParentId,
  variant = 'drawer',
  onSuccess,
  onClose,
}: {
  categoryId?: string
  defaultParentId?: string
  variant?: 'page' | 'drawer'
  onSuccess?: () => void
  onClose?: () => void
}) {
  const isEdit = Boolean(categoryId)
  const isDrawer = variant === 'drawer'

  const [loading, setLoading] = useState(isEdit)
  const [deleting, setDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [parents, setParents] = useState<ParentOption[]>([])
  const [productCount, setProductCount] = useState(0)
  const [childCount, setChildCount] = useState(0)
  const { confirmDelete } = useDeleteConfirm()
  const { can } = useAdminPermissions()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_CATEGORY_FORM_VALUES,
  })

  const name = watch('name')

  useEffect(() => {
    if (!isEdit && name) {
      setValue('slug', slugify(name), { shouldValidate: true })
    }
  }, [isEdit, name, setValue])

  useEffect(() => {
    if (!isEdit && defaultParentId) {
      setValue('parentId', defaultParentId, { shouldDirty: true })
    }
  }, [defaultParentId, isEdit, setValue])

  useEffect(() => {
    const parentsUrl = `/api/admin/categories?parents=true${categoryId ? `&excludeId=${categoryId}` : ''}`
    fetch(parentsUrl)
      .then((response) => response.json())
      .then((json: { data: ParentOption[] }) => setParents(json.data ?? []))
      .catch(() => setParents([]))
  }, [categoryId])

  useEffect(() => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    fetch(`/api/admin/categories/${categoryId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load category')
        return response.json() as Promise<{ data: AdminCategoryRow }>
      })
      .then((json) => {
        const category = json.data
        setProductCount(category.productCount)
        setChildCount(category.childCount)
        reset({
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          emoji: category.emoji ?? '📦',
          sortOrder: String(category.sortOrder),
          parentId: category.parentId ?? '',
        })
      })
      .catch((error: Error) => setSubmitError(error.message))
      .finally(() => setLoading(false))
  }, [categoryId, reset])

  async function onSubmit(values: CategoryFormValues) {
    setSubmitError(null)

    try {
      const payload = toPayload(values)
      const response = await fetch(
        isEdit ? `/api/admin/categories/${categoryId}` : '/api/admin/categories',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isEdit
              ? ({
                  name: payload.name,
                  slug: payload.slug,
                  description: payload.description ?? null,
                  emoji: payload.emoji,
                  sortOrder: payload.sortOrder,
                  parentId: payload.parentId,
                } satisfies UpdateCategoryInput)
              : payload,
          ),
        },
      )

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to save category')

      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSuccess?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  async function handleDelete() {
    if (!categoryId) return
    const confirmed = await confirmDelete({
      entityName: name?.trim() || 'this category',
      description:
        'Related subcategories and products will also be removed from the storefront.',
    })
    if (!confirmed) return

    setDeleting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to delete category')

      toast.success('Category deleted')
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const parentOptions = useMemo(
    () =>
      parents.map((parent) => ({
        value: parent.id,
        name: parent.name,
        emoji: parent.emoji,
        depth: parent.depth,
      })),
    [parents],
  )

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading category…</p>
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={isDrawer ? 'flex min-h-0 flex-1 flex-col' : 'space-y-6'}
    >
      <div className={isDrawer ? 'min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5' : 'space-y-5'}>
        <Field label="Name" required error={errors.name?.message} htmlFor="category-name">
          <Input id="category-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
        </Field>

        <Field label="Slug" required error={errors.slug?.message} htmlFor="category-slug" hint="Used in catalog URLs.">
          <Input id="category-slug" {...register('slug')} aria-invalid={Boolean(errors.slug)} />
        </Field>

        <Field label="Emoji" error={errors.emoji?.message} htmlFor="category-emoji">
          <Input id="category-emoji" {...register('emoji')} className="max-w-32" />
        </Field>

        <Field label="Description" error={errors.description?.message} htmlFor="category-description">
          <textarea
            id="category-description"
            {...register('description')}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Sort order" required error={errors.sortOrder?.message} htmlFor="category-sort">
          <Input id="category-sort" {...register('sortOrder')} className="max-w-32" />
        </Field>

        <Field label="Parent category" error={errors.parentId?.message} htmlFor="category-parent" hint="Up to 3 levels: top-level → subcategory → leaf category.">
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <CategoryTreeSelect
                id="category-parent"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={parentOptions}
                allowNone
                noneLabel="None (top-level)"
                aria-invalid={Boolean(errors.parentId)}
              />
            )}
          />
        </Field>

        {isEdit ? (
          <p className="text-xs text-muted-foreground">
            {productCount} product{productCount === 1 ? '' : 's'}
            {childCount > 0 ? ` · ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}` : ''}
          </p>
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </div>

      <div
        className={
          isDrawer
            ? 'flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4'
            : 'flex items-center justify-between gap-3'
        }
      >
        {isEdit && can('delete') ? (
          <Button
            type="button"
            variant="destructive"
            loading={deleting}
            onClick={() => void handleDelete()}
          >
            <Trash2 />
            Delete
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </div>
    </form>
  )
}
