/** Repository layer — Prisma-backed data access. */
export type { DbProduct } from '@/lib/repositories/ProductRepository'
export {
  ProductRepository,
  productRepository,
  mapDbProduct,
  mapListProduct,
  mapStoreInfo,
} from '@/lib/repositories/ProductRepository'
