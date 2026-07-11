/**
 * Thin facade — re-exports soft-delete service methods and shared constants.
 * Keeps legacy import paths (`@/lib/services/soft-delete`) working across the app.
 */
export { NOT_DELETED } from '@/lib/core/constants'
export { SlugHelper } from '@/lib/core/SlugHelper'

import { softDeleteService } from '@/lib/services/SoftDeleteService'

export const releaseUniqueValue = softDeleteService.releaseUniqueValue.bind(softDeleteService)
export const softDeleteProductRecord = softDeleteService.softDeleteProductRecord.bind(softDeleteService)
export const softDeleteStoreById = softDeleteService.softDeleteStoreById.bind(softDeleteService)
export const softDeleteCategoryById = softDeleteService.softDeleteCategoryById.bind(softDeleteService)
export const softDeleteProductById = softDeleteService.softDeleteProductById.bind(softDeleteService)
export const softDeleteCouponById = softDeleteService.softDeleteCouponById.bind(softDeleteService)
export const softDeleteUserById = softDeleteService.softDeleteUserById.bind(softDeleteService)
