import { z } from 'zod'

const couponTypes = ['PERCENT', 'SHIPPING', 'FIXED'] as const

export function createCouponFormSchema(isEdit: boolean) {
  return z
    .object({
      code: z
        .string()
        .trim()
        .min(2, 'Code must be at least 2 characters')
        .max(32, 'Code must be 32 characters or fewer')
        .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores only'),
      type: z.enum(couponTypes),
      value: z
        .string()
        .trim()
        .min(1, 'Value is required')
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
          message: 'Enter a valid value',
        }),
      label: z.string().trim().min(2, 'Label must be at least 2 characters'),
      active: z.boolean(),
      minSubtotal: z.string().trim().optional(),
      maxUses: z.string().trim().optional(),
      startsAt: z.string().trim().optional(),
      endsAt: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'PERCENT') {
        const percent = Number(data.value)
        if (percent > 100) {
          ctx.addIssue({
            code: 'custom',
            path: ['value'],
            message: 'Percentage cannot exceed 100',
          })
        }
      }

      if (data.minSubtotal?.trim()) {
        const min = Number(data.minSubtotal)
        if (Number.isNaN(min) || min < 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['minSubtotal'],
            message: 'Enter a valid minimum subtotal',
          })
        }
      }

      if (data.maxUses?.trim()) {
        const max = Number(data.maxUses)
        if (!Number.isInteger(max) || max < 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['maxUses'],
            message: 'Enter a whole number of 1 or more',
          })
        }
      }

      if (data.startsAt && data.endsAt) {
        const start = new Date(data.startsAt)
        const end = new Date(data.endsAt)
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
          ctx.addIssue({
            code: 'custom',
            path: ['endsAt'],
            message: 'End date must be after start date',
          })
        }
      }

      if (!isEdit && data.type === 'SHIPPING' && data.value !== '0') {
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'Shipping promos use a value of 0',
        })
      }
    })
}

export type CouponFormValues = z.infer<ReturnType<typeof createCouponFormSchema>>

export const DEFAULT_COUPON_FORM_VALUES: CouponFormValues = {
  code: '',
  type: 'PERCENT',
  value: '10',
  label: '',
  active: true,
  minSubtotal: '',
  maxUses: '',
  startsAt: '',
  endsAt: '',
}
