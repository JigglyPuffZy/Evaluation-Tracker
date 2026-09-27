/** Matches Supabase `normalize_training_title()` so trainings group correctly. */
export function normalizeTrainingTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-()/]/g, '')
}

const TYPO_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsamrt\b/g, 'smart'],
  [/\bsustaiable\b/g, 'sustainable'],
  [/\bsustanable\b/g, 'sustainable'],
  [/\bprogramm\b/g, 'program'],
]

/**
 * Smarter grouping for dashboard cards — treats SAMRT/SMART/Smart as the same program.
 * Different venues, dates, and response counts stay as separate sessions inside one card.
 */
export function normalizeTrainingTitleForGrouping(rawTitle: string): string {
  let normalized = normalizeTrainingTitle(rawTitle)
  for (const [pattern, replacement] of TYPO_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement)
  }

  const stopWords = new Set(['and', 'the', 'of', 'conduct', 'program', 'training'])
  return normalized
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .sort()
    .join(' ')
}

export function pickCanonicalTrainingTitle(titles: string[]): string {
  if (titles.length === 0) {
    return ''
  }

  const counts = new Map<string, number>()
  for (const title of titles) {
    counts.set(title, (counts.get(title) ?? 0) + 1)
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1]
    }
    return a[0].localeCompare(b[0])
  })[0][0]
}
