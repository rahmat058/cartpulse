import {
  isDemoPlaceholderImageUrl,
  resolveCategoryProductImage,
} from '@/lib/utils/category-product-images'

/**
 * Repair legacy demo image hosts (loremflickr / picsum) into category-relevant Unsplash URLs.
 * When `categorySlug` is known (catalog mapping), prefer that over URL keyword/lock heuristics.
 */
export function repairProductImageUrl(
  url: string,
  options?: { categorySlug?: string | null; productId?: string | null },
): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (!isDemoPlaceholderImageUrl(trimmed)) return trimmed

    const lock =
      parsed.searchParams.get('lock') ||
      parsed.pathname.match(/\/seed\/cartpulse-([^/]+)/)?.[1] ||
      undefined
    const keywords = decodeURIComponent(parsed.pathname.split('/').pop() ?? '')

    return resolveCategoryProductImage({
      categorySlug: options?.categorySlug,
      productId: options?.productId,
      lock,
      keywords: keywords.includes(',') || keywords.includes('%') ? keywords : undefined,
    })
  } catch {
    return trimmed
  }
}

export function normalizeProductImageUrls(
  imageUrls?: string[] | null,
  imageUrl?: string | null,
  options?: { categorySlug?: string | null; productId?: string | null },
): string[] {
  const urls = (imageUrls ?? [])
    .map((url) => repairProductImageUrl(url.trim(), options))
    .filter(Boolean)
  if (urls.length > 0) return urls
  if (imageUrl?.trim()) return [repairProductImageUrl(imageUrl.trim(), options)]
  return []
}

export function primaryProductImageUrl(imageUrls: string[]): string | null {
  return imageUrls[0] ?? null
}

export function diffRemovedImageUrls(previous: string[], next: string[]): string[] {
  const nextSet = new Set(next)
  return previous.filter((url) => !nextSet.has(url))
}
