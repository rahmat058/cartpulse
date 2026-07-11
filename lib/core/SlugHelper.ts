/**
 * Value-object helper for soft-delete slug/email/code release.
 * Appends a deterministic suffix so unique constraints can accept a new row later.
 */
export class SlugHelper {
  static releaseUniqueValue(value: string, id: string): string {
    const suffix = `__deleted__${id.slice(-8)}`
    const maxBaseLength = Math.max(1, 180 - suffix.length)
    return `${value.slice(0, maxBaseLength)}${suffix}`
  }
}
