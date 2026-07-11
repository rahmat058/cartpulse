export function normalizeProductImageUrls(
  imageUrls?: string[] | null,
  imageUrl?: string | null,
): string[] {
  const urls = (imageUrls ?? []).map((url) => url.trim()).filter(Boolean)
  if (urls.length > 0) return urls
  if (imageUrl?.trim()) return [imageUrl.trim()]
  return []
}

export function primaryProductImageUrl(imageUrls: string[]): string | null {
  return imageUrls[0] ?? null
}

export function diffRemovedImageUrls(previous: string[], next: string[]): string[] {
  const nextSet = new Set(next)
  return previous.filter((url) => !nextSet.has(url))
}
