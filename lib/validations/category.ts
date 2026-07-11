import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().optional(),
  emoji: z.string().trim().optional(),
  sortOrder: z
    .string()
    .trim()
    .min(1, 'Sort order is required')
    .refine((value) => !Number.isNaN(Number(value)), { message: 'Enter a valid sort order' }),
  parentId: z.string().trim().optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const DEFAULT_CATEGORY_FORM_VALUES: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  emoji: '📦',
  sortOrder: '0',
  parentId: '',
}
