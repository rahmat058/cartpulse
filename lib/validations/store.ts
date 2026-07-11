import { z } from 'zod'
import { isRichTextEmpty } from '@/lib/utils/rich-text'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function createStoreFormSchema(isEdit: boolean) {
  return z.object({
    name: z.string().trim().min(2, 'Store name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only'),
    description: z
      .string()
      .optional()
      .refine((value) => !value || !isRichTextEmpty(value), {
        message: 'Description cannot be empty',
      }),
    supportEmail: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
        message: 'Enter a valid email address',
      }),
    logoEmoji: z.string().min(1, 'Emoji is required'),
    logoUrl: z.string().optional(),
    currency: z.string().trim().min(3, 'Currency code is required').max(3, 'Use a 3-letter currency code'),
    taxRate: z
      .string()
      .trim()
      .min(1, 'Tax rate is required')
      .refine(
        (value) => {
          const rate = Number(value)
          return !Number.isNaN(rate) && rate >= 0 && rate <= 1
        },
        { message: 'Enter a decimal between 0 and 1 (e.g. 0.08)' },
      ),
    shippingFlat: z
      .string()
      .trim()
      .min(1, 'Shipping flat rate is required')
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
        message: 'Enter a valid shipping amount',
      }),
    freeShippingThreshold: z
      .string()
      .trim()
      .min(1, 'Free shipping threshold is required')
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
        message: 'Enter a valid threshold amount',
      }),
    active: z.boolean(),
    verified: isEdit ? z.boolean() : z.boolean().optional(),
  })
}

export type StoreFormValues = z.infer<ReturnType<typeof createStoreFormSchema>>

export const DEFAULT_STORE_FORM_VALUES: StoreFormValues = {
  name: '',
  slug: '',
  description: '',
  supportEmail: '',
  logoEmoji: '🛍️',
  logoUrl: '',
  currency: 'USD',
  taxRate: '0.08',
  shippingFlat: '5.99',
  freeShippingThreshold: '75',
  active: true,
  verified: false,
}
