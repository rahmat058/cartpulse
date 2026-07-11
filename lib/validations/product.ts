import { z } from 'zod'
import { stripRichText } from '@/lib/utils/rich-text'
import type { CreateProductVariantInput, ProductVariantType } from '@/types/admin'

export const SIZE_VARIANT_HEX = '#e2e8f0'

const variantFormSchema = z.object({
  sku: z.string(),
  slug: z.string(),
  color: z.string(),
  hex: z.string(),
  stock: z.string(),
  price: z.string(),
  isDefault: z.boolean(),
})

function variantRowStarted(variant: z.infer<typeof variantFormSchema>) {
  return Boolean(
    variant.sku.trim() ||
    variant.color.trim() ||
    variant.slug.trim() ||
    variant.price.trim() ||
    Number(variant.stock) > 0,
  )
}

function slugifyVariant(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function buildProductVariantsFromForm(
  rows: z.infer<typeof variantFormSchema>[],
  variantType: ProductVariantType = 'COLOR',
): CreateProductVariantInput[] {
  const started = rows.filter(variantRowStarted)
  const usedSlugs = new Set<string>()

  return started.map((variant, index) => {
    const sku = variant.sku.trim()
    const color = variant.color.trim() || sku
    const baseSlug = slugifyVariant(variant.slug.trim() || color || sku) || `variant-${index + 1}`

    let slug = baseSlug
    let suffix = 2
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`
    }
    usedSlugs.add(slug)

    return {
      sku,
      slug,
      color,
      hex: variantType === 'COLOR' ? variant.hex || '#0d9488' : SIZE_VARIANT_HEX,
      stock: Number(variant.stock) || 0,
      price: variant.price ? Number(variant.price) : undefined,
      isDefault: variant.isDefault || index === 0,
    }
  })
}

/** Product stock is the sum of variant stock when variants exist; otherwise the main stock field. */
export function computeProductStockFromFormValues(values: {
  stock: string
  variants: z.infer<typeof variantFormSchema>[]
  variantType?: ProductVariantType
}): number {
  const variants = buildProductVariantsFromForm(values.variants, values.variantType ?? 'COLOR')
  if (variants.length > 0) {
    return variants.reduce((sum, variant) => sum + variant.stock, 0)
  }
  return Number(values.stock) || 0
}

export function createProductFormSchema(isEdit: boolean) {
  return z
    .object({
      storeId: isEdit ? z.string().optional() : z.string().min(1, 'Please select a store'),
      name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
      categorySlug: z.string().min(1, 'Select a category'),
      price: z
        .string()
        .trim()
        .min(1, 'Price is required')
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
          message: 'Enter a valid price',
        }),
      stock: z
        .string()
        .trim()
        .min(1, 'Stock is required')
        .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, {
          message: 'Enter a valid stock amount',
        }),
      rating: isEdit
        ? z
            .string()
            .trim()
            .min(1, 'Rating is required')
            .refine(
              (value) => {
                const rating = Number(value)
                return !Number.isNaN(rating) && rating >= 0 && rating <= 5
              },
              { message: 'Rating must be between 0 and 5' },
            )
        : z.string().optional(),
      emoji: z.string().min(1, 'Emoji is required'),
      imageUrls: z.array(z.string().url('Enter a valid image URL')),
      description: z.string().refine((value) => stripRichText(value).length >= 10, {
        message: 'Description must be at least 10 characters',
      }),
      published: z.boolean(),
      isDigital: z.boolean(),
      digitalAssetUrl: z.string().trim(),
      variantType: z.enum(['COLOR', 'SIZE']),
      variants: z.array(variantFormSchema),
    })
    .superRefine((data, ctx) => {
      if (data.isDigital) {
        const url = data.digitalAssetUrl.trim()
        if (!url) {
          ctx.addIssue({
            code: 'custom',
            message: 'Download URL is required for digital products',
            path: ['digitalAssetUrl'],
          })
        } else {
          try {
            new URL(url)
          } catch {
            ctx.addIssue({
              code: 'custom',
              message: 'Enter a valid download URL',
              path: ['digitalAssetUrl'],
            })
          }
        }
        return
      }

      data.variants.forEach((variant, index) => {
        if (!variantRowStarted(variant)) return
        if (!variant.sku.trim()) {
          ctx.addIssue({
            code: 'custom',
            message: 'SKU is required for each variant row',
            path: ['variants', index, 'sku'],
          })
        }
        if (variant.stock.trim() && (!Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Enter a valid stock amount',
            path: ['variants', index, 'stock'],
          })
        }
      })

      const builtVariants = buildProductVariantsFromForm(data.variants, data.variantType)
      if (builtVariants.length > 0) return

      if (!data.stock.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Stock is required',
          path: ['stock'],
        })
      }
    })
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>

export const EMPTY_VARIANT: ProductFormValues['variants'][number] = {
  sku: '',
  slug: '',
  color: '',
  hex: '#0d9488',
  stock: '0',
  price: '',
  isDefault: false,
}

export const DEFAULT_PRODUCT_FORM_VALUES: ProductFormValues = {
  storeId: '',
  name: '',
  categorySlug: 'audio',
  price: '',
  stock: '',
  rating: '',
  emoji: '📦',
  imageUrls: [],
  description: '',
  published: true,
  isDigital: false,
  digitalAssetUrl: '',
  variantType: 'COLOR',
  variants: [],
}
