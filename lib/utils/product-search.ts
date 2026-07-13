import type { Prisma } from '@/app/generated/prisma/client'

/**
 * Match `token` as a whole word/prefix — not a mid-word substring.
 * Avoids false hits like search "mobile" matching description "...automobiles...".
 */
function fieldMatchesToken(
  field: 'name' | 'slug' | 'description',
  token: string,
): Prisma.ProductWhereInput[] {
  const mode = 'insensitive' as const
  return [
    { [field]: { equals: token, mode } },
    // Prefix of the field / first word (typeahead: "head" → Headphones)
    { [field]: { startsWith: token, mode } },
    // Token after whitespace or hyphen (multi-word names / slugs)
    { [field]: { contains: ` ${token}`, mode } },
    { [field]: { contains: `-${token}`, mode } },
  ]
}

/** Prisma `where` fragment for catalog / typeahead product search. */
export function productSearchWhere(search: string): Prisma.ProductWhereInput {
  const term = search.trim()
  if (!term) return {}

  const tokens = term.split(/\s+/).filter(Boolean)
  if (tokens.length === 1) {
    const token = tokens[0]
    return {
      OR: [
        ...fieldMatchesToken('name', token),
        ...fieldMatchesToken('slug', token),
        ...fieldMatchesToken('description', token),
      ],
    }
  }

  // Every token must appear as a word/prefix in name or slug.
  return {
    AND: tokens.map((token) => ({
      OR: [...fieldMatchesToken('name', token), ...fieldMatchesToken('slug', token)],
    })),
  }
}
