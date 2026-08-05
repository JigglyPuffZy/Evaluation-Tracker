/** Matches Supabase `normalize_training_title()` so trainings group correctly. */
export function normalizeTrainingTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-()/]/g, '')
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
