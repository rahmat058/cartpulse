import type { Product } from '@/types/cart'

export type CouponType = 'PERCENT' | 'SHIPPING' | 'FIXED'

export interface CouponDefinition {
  code: string
  type: CouponType
  value: number
  label: string
  minSubtotal?: number | null
}

export interface WishlistState {
  productIds: string[]
  productsById: Record<string, Product>
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  hydrated: boolean
}
