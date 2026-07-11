export type ProductVariantType = 'COLOR' | 'SIZE'

export interface CreateProductVariantInput {
  sku: string
  slug: string
  color: string
  hex: string
  stock: number
  price?: number
  emoji?: string
  isDefault?: boolean
}

export interface CreateProductInput {
  storeId: string
  name: string
  categorySlug: string
  price: number
  stock: number
  rating?: number
  emoji: string
  imageUrl?: string
  imageUrls?: string[]
  description: string
  published?: boolean
  isDigital?: boolean
  digitalAssetUrl?: string | null
  variantType?: ProductVariantType
  variants?: CreateProductVariantInput[]
}

export interface UpdateProductInput {
  name?: string
  categorySlug?: string
  price?: number
  stock?: number
  rating?: number
  emoji?: string
  imageUrl?: string | null
  imageUrls?: string[] | null
  description?: string
  published?: boolean
  isDigital?: boolean
  digitalAssetUrl?: string | null
  variantType?: ProductVariantType
  variants?: CreateProductVariantInput[]
}

export interface CreateStoreInput {
  name: string
  slug: string
  description?: string
  supportEmail?: string
  logoEmoji: string
  logoUrl?: string
  currency?: string
  taxRate?: number
  shippingFlat?: number
  freeShippingThreshold?: number
  active?: boolean
  verified?: boolean
}

export interface UpdateStoreInput {
  name?: string
  slug?: string
  description?: string | null
  supportEmail?: string | null
  logoEmoji?: string
  logoUrl?: string | null
  currency?: string
  taxRate?: number
  shippingFlat?: number
  freeShippingThreshold?: number
  active?: boolean
  verified?: boolean
}

export interface AdminStoreRow {
  id: string
  slug: string
  name: string
  description?: string | null
  supportEmail?: string | null
  logoEmoji?: string
  logoUrl?: string | null
  currency: string
  taxRate: number
  shippingFlat: number
  freeShippingThreshold: number
  verified: boolean
  active: boolean
  productCount?: number
}

export type AdminCouponType = 'PERCENT' | 'SHIPPING' | 'FIXED'

export interface CreateCouponInput {
  code: string
  type: AdminCouponType
  value: number
  label: string
  active?: boolean
  minSubtotal?: number | null
  maxUses?: number | null
  startsAt?: string | null
  endsAt?: string | null
}

export interface UpdateCouponInput {
  code?: string
  type?: AdminCouponType
  value?: number
  label?: string
  active?: boolean
  minSubtotal?: number | null
  maxUses?: number | null
  startsAt?: string | null
  endsAt?: string | null
}

export interface AdminCouponDetail {
  id: string
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
  createdAt: string
}

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string
  emoji?: string
  sortOrder?: number
  parentId?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string | null
  emoji?: string | null
  sortOrder?: number
  parentId?: string | null
}

export interface AdminCategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  emoji: string | null
  sortOrder: number
  parentId: string | null
  parentName: string | null
  productCount: number
  childCount: number
  depth: number
  pathLabel: string
}

export interface AdminCategoryTreeNode {
  id: string
  slug: string
  name: string
  emoji: string | null
  sortOrder: number
  parentId: string | null
  productCount: number
  childCount: number
  depth: number
  pathLabel: string
  children: AdminCategoryTreeNode[]
}

export interface AdminCategoryParentOption {
  id: string
  name: string
  slug: string
  depth: number
  emoji: string | null
  label: string
}

export interface AdminProductRow {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  rating: number
  emoji: string
  imageUrl?: string | null
  imageUrls?: string[]
  description: string
  published: boolean
  isDigital: boolean
  digitalAssetUrl?: string | null
  store: {
    id: string
    slug: string
    name: string
  }
  category: {
    slug: string
    name: string
  }
  variantCount: number
  variantType?: ProductVariantType
  variants?: CreateProductVariantInput[]
}
