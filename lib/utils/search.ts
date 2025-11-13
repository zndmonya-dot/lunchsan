const MAX_QUERY_LENGTH = 120

export function normalizeSearchQuery(raw: string): string | null {
  if (!raw) return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  const normalized = trimmed
    .replace(/[^\p{L}\p{N}\s\-ー]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (normalized.length === 0) return null

  const joined = normalized.join(' ')
  return joined.length > MAX_QUERY_LENGTH ? joined.slice(0, MAX_QUERY_LENGTH) : joined
}

