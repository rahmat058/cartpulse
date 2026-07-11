import type { Product } from '@/types/cart'

export function isDigitalProduct(product: Pick<Product, 'isDigital'>): boolean {
  return Boolean(product.isDigital)
}

export function cartHasDigitalProduct(
  lines: Array<{ productId: string }>,
  productsById: Record<string, Product>,
): boolean {
  return lines.some((line) => isDigitalProduct(productsById[line.productId] ?? {}))
}

export function cartIsAllDigital(lines: Array<{ productId: string }>, productsById: Record<string, Product>): boolean {
  if (lines.length === 0) return false
  return lines.every((line) => isDigitalProduct(productsById[line.productId] ?? {}))
}

export function getDigitalDownloadUrl(product: Pick<Product, 'isDigital' | 'digitalAssetUrl'>): string | null {
  if (!product.isDigital) return null
  const url = product.digitalAssetUrl?.trim()
  return url || null
}
