'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminCouponType, CreateCouponInput, UpdateCouponInput } from '@/types/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { DateTimePicker } from '@/components/ui/DatePicker'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/lib/utils/datetime-picker'
import { formSelectClass } from '@/lib/utils/form-controls'
import {
  createCouponFormSchema,
  DEFAULT_COUPON_FORM_VALUES,
  type CouponFormValues,
} from '@/lib/validations/coupon'

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

function formValueToStoredValue(type: AdminCouponType, value: string): number {
  const numeric = Number(value)
  if (type === 'PERCENT') return numeric / 100
  return numeric
}

function storedValueToFormValue(type: AdminCouponType, value: number): string {
  if (type === 'PERCENT') return String(Math.round(value * 1000) / 10)
  return String(value)
}

function valueLabel(type: AdminCouponType): string {
  if (type === 'PERCENT') return 'Discount percent'
  if (type === 'FIXED') return 'Discount amount'
  return 'Value'
}

function valueHint(type: AdminCouponType): string | undefined {
  if (type === 'PERCENT') return 'Enter a whole or decimal percent (e.g. 10 for 10% off).'
  if (type === 'SHIPPING') return 'Shipping promos use 0 — free shipping is applied at checkout.'
  return 'Fixed dollar amount taken off the subtotal.'
}

function toPayload(values: CouponFormValues): CreateCouponInput {
  return {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value: formValueToStoredValue(values.type, values.value),
    label: values.label.trim(),
    active: values.active,
    minSubtotal: values.minSubtotal?.trim() ? Number(values.minSubtotal) : null,
    maxUses: values.maxUses?.trim() ? Number(values.maxUses) : null,
    startsAt: fromDateTimeLocalValue(values.startsAt ?? ''),
    endsAt: fromDateTimeLocalValue(values.endsAt ?? ''),
  }
}

export function CouponForm({
  couponId,
  variant = 'drawer',
  onSuccess,
  onClose,
}: {
  couponId?: string
  variant?: 'page' | 'drawer'
  onSuccess?: () => void
  onClose?: () => void
}) {
  const isEdit = Boolean(couponId)
  const isDrawer = variant === 'drawer'
  const schema = useMemo(() => createCouponFormSchema(isEdit), [isEdit])

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [usedCount, setUsedCount] = useState(0)
  const { confirmDelete } = useDeleteConfirm()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_COUPON_FORM_VALUES,
  })

  const couponType = watch('type')
  const couponCode = watch('code')

  useEffect(() => {
    async function load() {
      try {
        if (couponId) {
          const response = await fetch(`/api/admin/coupons/${couponId}`)
          if (!response.ok) throw new Error('Failed to load promo code')
          const json = (await response.json()) as {
            data: {
              code: string
              type: AdminCouponType
              value: number
              label: string
              active: boolean
              minSubtotal: number | null
              maxUses: number | null
              usedCount: number
              startsAt: string | null
              endsAt: string | null
            }
          }
          const coupon = json.data
          setUsedCount(coupon.usedCount)
          reset({
            code: coupon.code,
            type: coupon.type,
            value: storedValueToFormValue(coupon.type, coupon.value),
            label: coupon.label,
            active: coupon.active,
            minSubtotal: coupon.minSubtotal != null ? String(coupon.minSubtotal) : '',
            maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
            startsAt: toDateTimeLocalValue(coupon.startsAt),
            endsAt: toDateTimeLocalValue(coupon.endsAt),
          })
        } else {
          reset(DEFAULT_COUPON_FORM_VALUES)
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [couponId, reset])

  useEffect(() => {
    if (couponType === 'SHIPPING') {
      setValue('value', '0', { shouldValidate: true })
    }
  }, [couponType, setValue])

  async function onSubmit(values: CouponFormValues) {
    setSubmitError(null)

    try {
      const payload = toPayload(values)
      const response = await fetch(isEdit ? `/api/admin/coupons/${couponId}` : '/api/admin/coupons', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? ({
                code: payload.code,
                type: payload.type,
                value: payload.value,
                label: payload.label,
                active: payload.active,
                minSubtotal: payload.minSubtotal,
                maxUses: payload.maxUses,
                startsAt: payload.startsAt,
                endsAt: payload.endsAt,
              } satisfies UpdateCouponInput)
            : payload,
        ),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to save promo code')

      toast.success(isEdit ? 'Promo code updated' : 'Promo code created')
      onSuccess?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save promo code')
    }
  }

  async function handleDelete() {
    if (!couponId) return
    const confirmed = await confirmDelete({
      entityName: couponCode?.trim() || 'this promo code',
      description: 'It will no longer be available at checkout.',
    })
    if (!confirmed) return

    setDeleting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, { method: 'DELETE' })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to delete promo code')

      toast.success('Promo code deleted')
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete promo code'
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
          <Field label="Code" required error={errors.code?.message} htmlFor="code">
            <Input
              id="code"
              {...register('code')}
              className="font-mono uppercase"
              aria-invalid={Boolean(errors.code)}
            />
          </Field>
          <Field label="Type" required error={errors.type?.message} htmlFor="type">
            <select id="type" {...register('type')} className={formSelectClass}>
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed amount</option>
              <option value="SHIPPING">Free shipping</option>
            </select>
          </Field>
        </div>

        <Field
          label={valueLabel(couponType)}
          required
          error={errors.value?.message}
          htmlFor="value"
          hint={valueHint(couponType)}
        >
          <Input
            id="value"
            type="number"
            min="0"
            step={couponType === 'PERCENT' ? '0.1' : '0.01'}
            disabled={couponType === 'SHIPPING'}
            {...register('value')}
            aria-invalid={Boolean(errors.value)}
          />
        </Field>

        <Field label="Label" required error={errors.label?.message} htmlFor="label">
          <Input id="label" {...register('label')} aria-invalid={Boolean(errors.label)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum subtotal" error={errors.minSubtotal?.message} htmlFor="minSubtotal">
            <Input
              id="minSubtotal"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              {...register('minSubtotal')}
              aria-invalid={Boolean(errors.minSubtotal)}
            />
          </Field>
          <Field label="Max uses" error={errors.maxUses?.message} htmlFor="maxUses">
            <Input
              id="maxUses"
              type="number"
              min="1"
              step="1"
              placeholder="Optional"
              {...register('maxUses')}
              aria-invalid={Boolean(errors.maxUses)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts at" error={errors.startsAt?.message} htmlFor="startsAt">
            <Controller
              name="startsAt"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  id="startsAt"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select start date and time"
                  align="start"
                  aria-invalid={Boolean(errors.startsAt)}
                />
              )}
            />
          </Field>
          <Field label="Ends at" error={errors.endsAt?.message} htmlFor="endsAt">
            <Controller
              name="endsAt"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  id="endsAt"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select end date and time"
                  align="end"
                  aria-invalid={Boolean(errors.endsAt)}
                />
              )}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">Allow this code at checkout</p>
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
          <p className="text-xs text-muted-foreground">
            Used {usedCount} time{usedCount === 1 ? '' : 's'} so far.
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
              {isEdit ? 'Save changes' : 'Create promo code'}
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
                disabled={isSubmitting || deleting}
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
            {isEdit ? 'Save changes' : 'Create promo code'}
          </Button>
        )}
      </div>
    </form>
  )

  return formContent
}
