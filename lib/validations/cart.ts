import { z } from 'zod'
import { getCartLineKey } from '@/types/cart'
import type { CartItemsById } from '@/types/cart'

const MAX_CART_LINE_QUANTITY = 999

const cartLineSchema = z.object({
  productId: z.string().trim().min(1, 'productId is required'),
  variantId: z.string().trim().min(1).optional(),
  quantity: z
    .number()
    .int('quantity must be a whole number')
    .min(1, 'quantity must be at least 1')
    .max(MAX_CART_LINE_QUANTITY, `quantity cannot exceed ${MAX_CART_LINE_QUANTITY}`),
})

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  phone: z.string().trim().min(1, 'phone is required'),
  line1: z.string().trim().min(1, 'line1 is required'),
  line2: z.string().trim().nullable().optional(),
  city: z.string().trim().min(1, 'city is required'),
  country: z.string().trim().min(1, 'country is required'),
})

export const checkoutBodySchema = z.object({
  itemsById: z.record(z.string(), cartLineSchema).refine((items) => Object.keys(items).length > 0, {
    message: 'Cart is empty',
  }),
  promoCode: z.string().trim().nullable().optional(),
  paymentMethod: z.enum(['COD', 'STRIPE']).optional(),
  deliveryNote: z.string().trim().nullable().optional(),
  shippingAddress: shippingAddressSchema,
})

export type CheckoutBody = z.infer<typeof checkoutBodySchema>

/**
 * Normalize client cart payload — only productId, variantId, and quantity are kept.
 * Prices and totals are never read from the client.
 */
export function sanitizeCartItemsById(raw: CartItemsById): CartItemsById {
  const sanitized: CartItemsById = {}

  for (const line of Object.values(raw)) {
    const parsed = cartLineSchema.safeParse(line)
    if (!parsed.success) {
      throw new Error('Invalid cart item')
    }

    const { productId, variantId, quantity } = parsed.data
    const lineKey = getCartLineKey(productId, variantId)
    const existing = sanitized[lineKey]

    if (existing) {
      const merged = existing.quantity + quantity
      if (merged > MAX_CART_LINE_QUANTITY) {
        throw new Error(`Quantity cannot exceed ${MAX_CART_LINE_QUANTITY} per item`)
      }
      existing.quantity = merged
    } else {
      sanitized[lineKey] = { productId, variantId, quantity }
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error('Cart is empty')
  }

  return sanitized
}
