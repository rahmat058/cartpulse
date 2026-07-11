'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CreateStoreInput, UpdateStoreInput } from '@/types/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { formSelectClass } from '@/lib/utils/form-controls'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { isRichTextEmpty, sanitizeRichText } from '@/lib/utils/rich-text'
import {
  createStoreFormSchema,
  DEFAULT_STORE_FORM_VALUES,
  type StoreFormValues,
} from '@/lib/validations/store'

const LOGO_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function toPayload(values: StoreFormValues): CreateStoreInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description && !isRichTextEmpty(values.description)
      ? sanitizeRichText(values.description)
      : undefined,
    supportEmail: values.supportEmail?.trim() || undefined,
    logoEmoji: values.logoEmoji.trim(),
    logoUrl: values.logoUrl?.trim() || undefined,
    currency: values.currency.trim(),
    taxRate: Number(values.taxRate),
    shippingFlat: Number(values.shippingFlat),
    freeShippingThreshold: Number(values.freeShippingThreshold),
    active: values.active,
    verified: values.verified ?? false,
  }
}

export function StoreForm({
  storeId,
  variant = 'drawer',
  onSuccess,
  onClose,
}: {
  storeId?: string
  variant?: 'page' | 'drawer'
  onSuccess?: () => void
  onClose?: () => void
}) {
  const isEdit = Boolean(storeId)
  const isDrawer = variant === 'drawer'
  const schema = useMemo(() => createStoreFormSchema(isEdit), [isEdit])

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [productCount, setProductCount] = useState(0)
  const { confirmDelete } = useDeleteConfirm()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_STORE_FORM_VALUES,
  })

  const logoUrl = watch('logoUrl')
  const storeName = watch('name')

  useEffect(() => {
    async function load() {
      try {
        if (storeId) {
          const response = await fetch(`/api/admin/stores/${storeId}`)
          if (!response.ok) throw new Error('Failed to load store')
          const json = (await response.json()) as {
            data: {
              name: string
              slug: string
              description?: string | null
              supportEmail?: string | null
              logoEmoji?: string
              logoUrl?: string | null
              currency: string
              taxRate: number
              shippingFlat: number
              freeShippingThreshold: number
              active: boolean
              verified: boolean
              productCount?: number
            }
          }
          const store = json.data
          setProductCount(store.productCount ?? 0)
          reset({
            name: store.name,
            slug: store.slug,
            description: store.description ?? '',
            supportEmail: store.supportEmail ?? '',
            logoEmoji: store.logoEmoji ?? '🛍️',
            logoUrl: store.logoUrl ?? '',
            currency: store.currency,
            taxRate: String(store.taxRate),
            shippingFlat: String(store.shippingFlat),
            freeShippingThreshold: String(store.freeShippingThreshold),
            active: store.active,
            verified: store.verified,
          })
        } else {
          reset(DEFAULT_STORE_FORM_VALUES)
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [storeId, reset])

  function handleNameBlur() {
    if (isEdit) return
    const slug = getValues('slug').trim()
    if (!slug) {
      setValue('slug', slugify(getValues('name')), { shouldValidate: true })
    }
  }

  async function handleLogoUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setUploading(true)
    setSubmitError(null)
    try {
      const body = new FormData()
      body.append('file', file)

      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const json = (await response.json()) as {
        data?: Array<{ url: string }>
        error?: string
      }
      if (!response.ok) throw new Error(json.error ?? 'Upload failed')

      const uploadedUrl = json.data?.[0]?.url
      if (!uploadedUrl) throw new Error('Upload failed')

      const previousUrl = logoUrl?.trim()
      if (previousUrl) {
        await fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: previousUrl }),
        })
      }

      setValue('logoUrl', uploadedUrl, { shouldDirty: true, shouldValidate: true })
      toast.success('Logo uploaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveLogo() {
    const currentUrl = logoUrl?.trim()
    if (!currentUrl) return

    setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true })
    try {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl }),
      })
    } catch {
      // Best-effort cleanup; store save will reconcile persisted value.
    }
  }

  async function onSubmit(values: StoreFormValues) {
    setSubmitError(null)

    try {
      const payload = toPayload(values)
      const response = await fetch(isEdit ? `/api/admin/stores/${storeId}` : '/api/admin/stores', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? ({
                name: payload.name,
                slug: payload.slug,
                description: payload.description ?? null,
                supportEmail: payload.supportEmail ?? null,
                logoEmoji: payload.logoEmoji,
                logoUrl: payload.logoUrl ?? null,
                currency: payload.currency,
                taxRate: payload.taxRate,
                shippingFlat: payload.shippingFlat,
                freeShippingThreshold: payload.freeShippingThreshold,
                active: payload.active,
                verified: payload.verified,
              } satisfies UpdateStoreInput)
            : payload,
        ),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to save store')

      toast.success(isEdit ? 'Store updated' : 'Store created')
      onSuccess?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save store')
    }
  }

  async function handleDelete() {
    if (!storeId) return
    const confirmed = await confirmDelete({
      entityName: storeName?.trim() || 'this store',
      description: 'Its products will also be removed from the storefront.',
    })
    if (!confirmed) return

    setDeleting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, { method: 'DELETE' })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to delete store')

      toast.success('Store deleted')
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete store'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <p className={isDrawer ? 'px-5 py-8 text-sm text-muted-foreground' : 'p-8 text-sm text-muted-foreground'}>
        Loading…
      </p>
    )
  }

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={
        isDrawer
          ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
          : 'mt-8 max-w-2xl space-y-5 rounded-md border border-border bg-card p-6'
      }
    >
      <div
        className={
          isDrawer
            ? 'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4'
            : 'space-y-5'
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" required error={errors.name?.message} htmlFor="name">
            <Input
              id="name"
              {...register('name', { onBlur: handleNameBlur })}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field label="Slug" required error={errors.slug?.message} htmlFor="slug">
            <Input id="slug" {...register('slug')} aria-invalid={Boolean(errors.slug)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo emoji" required error={errors.logoEmoji?.message} htmlFor="logoEmoji">
            <Input id="logoEmoji" {...register('logoEmoji')} aria-invalid={Boolean(errors.logoEmoji)} />
          </Field>
          <Field label="Currency" required error={errors.currency?.message} htmlFor="currency">
            <Input id="currency" {...register('currency')} aria-invalid={Boolean(errors.currency)} />
          </Field>
        </div>

        <Field label="Store logo" error={errors.logoUrl?.message}>
          <div className="space-y-3">
            <label className="border-input text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition-colors hover:border-teal-500">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload logo (PNG, JPEG, JPG, WebP)'}
              <input
                type="file"
                accept={LOGO_IMAGE_ACCEPT}
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  void handleLogoUpload(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>

            {logoUrl ? (
              <div className="group border-border bg-muted/30 relative w-28 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => void handleRemoveLogo()}
                  className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  aria-label="Remove logo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Upload a square logo image. Emoji is used as fallback when no logo is set.
              </p>
            )}
          </div>
        </Field>

        <Field label="Description" error={errors.description?.message} htmlFor="description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="description"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.description)}
                placeholder="Tell customers about your store, products, and policies."
                minHeight={140}
              />
            )}
          />
        </Field>

        <Field label="Support email" error={errors.supportEmail?.message} htmlFor="supportEmail">
          <Input
            id="supportEmail"
            type="email"
            {...register('supportEmail')}
            aria-invalid={Boolean(errors.supportEmail)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tax rate" required error={errors.taxRate?.message} htmlFor="taxRate">
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="1"
              step="0.01"
              {...register('taxRate')}
              aria-invalid={Boolean(errors.taxRate)}
            />
          </Field>
          <Field label="Shipping flat" required error={errors.shippingFlat?.message} htmlFor="shippingFlat">
            <Input
              id="shippingFlat"
              type="number"
              min="0"
              step="0.01"
              {...register('shippingFlat')}
              aria-invalid={Boolean(errors.shippingFlat)}
            />
          </Field>
          <Field
            label="Free shipping at"
            required
            error={errors.freeShippingThreshold?.message}
            htmlFor="freeShippingThreshold"
          >
            <Input
              id="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              {...register('freeShippingThreshold')}
              aria-invalid={Boolean(errors.freeShippingThreshold)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">Show this store on the storefront</p>
          </div>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Active" />
            )}
          />
        </div>

        {isEdit ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Verified</p>
              <p className="text-xs text-muted-foreground">Mark store as verified on the directory</p>
            </div>
            <Controller
              name="verified"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value ?? false} onCheckedChange={field.onChange} aria-label="Verified" />
              )}
            />
          </div>
        ) : null}

        {isEdit && productCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            This store has {productCount} product{productCount === 1 ? '' : 's'}. Remove products before deleting the store.
          </p>
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </div>

      <div
        className={
          isDrawer
            ? 'flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-card p-5'
            : 'space-y-3'
        }
      >
        {isDrawer ? (
          <>
            <Button type="submit" disabled={isSubmitting || deleting} loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create store'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
              onClick={onClose}
              disabled={isSubmitting || deleting}
            >
              Cancel
            </Button>
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                className="ml-auto"
                disabled={isSubmitting || deleting || productCount > 0}
                loading={deleting}
                onClick={() => void handleDelete()}
              >
                <Trash2 />
                Delete
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create store'}
          </Button>
        )}
      </div>
    </form>
  )

  return formContent
}
