export function formatCategoryOptionPrefix(depth: number): string {
  if (depth <= 1) return ''
  return '— '.repeat(depth - 1)
}

export function formatCategoryOptionLabel(name: string, emoji: string | null | undefined, depth: number): string {
  const prefix = formatCategoryOptionPrefix(depth)
  return `${prefix}${emoji ?? '📦'} ${name}`.trim()
}
