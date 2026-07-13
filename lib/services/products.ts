/**
 * Thin facade — preserves existing import paths while delegating to OOP services.
 * API routes and server components should import from here for stability.
 */
export type { DbProduct } from '@/lib/repositories/ProductRepository'
export { mapDbProduct, mapListProduct, mapStoreInfo, productRepository } from '@/lib/repositories/ProductRepository'

import { catalogService } from '@/lib/services/CatalogService'

export const parseCatalogQueryParams = catalogService.parseCatalogQueryParams.bind(catalogService)
export const getProducts = catalogService.getProducts.bind(catalogService)
export const getProductBySlug = catalogService.getProductBySlug.bind(catalogService)
export const getProductsByIds = catalogService.getProductsByIds.bind(catalogService)
export const getFeaturedProducts = catalogService.getFeaturedProducts.bind(catalogService)
