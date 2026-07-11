/**
 * Shared persistence filters used across repositories and services.
 * Centralised here so soft-delete logic and queries stay consistent.
 */
export const NOT_DELETED = { deletedAt: null } as const
