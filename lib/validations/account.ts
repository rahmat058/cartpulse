import { z } from 'zod'

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const next = data.newPassword?.trim() ?? ''
    const confirm = data.confirmPassword?.trim() ?? ''

    if (!next) return

    if (next.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Password must be at least 8 characters',
      })
    }

    if (!confirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Confirm your new password',
      })
      return
    }

    if (next !== confirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }
  })

export type ProfileFormValues = z.infer<typeof profileSchema>

export function profileSchemaWithPassword(hasPassword: boolean) {
  return profileSchema.superRefine((data, ctx) => {
    const next = data.newPassword?.trim() ?? ''
    if (!next || !hasPassword) return
    if (!(data.currentPassword ?? '').trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Current password is required to set a new one',
      })
    }
  })
}

export const reviewSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required'),
  rating: z
    .number({ error: 'Rating is required' })
    .int()
    .min(1, 'Min rating is 1')
    .max(5, 'Max rating is 5'),
  body: z.string().trim().max(2000, 'Review is too long').optional().or(z.literal('')),
})

export type ReviewFormValues = z.infer<typeof reviewSchema>

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().min(6, 'Enter a valid phone number'),
  line1: z.string().trim().min(3, 'Address line 1 is required'),
  line2: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required'),
  country: z.string().trim().min(2, 'Country is required'),
})

export type AddressFormValues = z.infer<typeof addressSchema>

export const EMPTY_ADDRESS: AddressFormValues = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  country: 'United States',
}
