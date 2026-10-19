export function generateFormSlug(trainingTitle: string): string {
  const base = trainingTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48)

  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || 'training'}-${suffix}`
}

export function buildPublicFormUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return `/f/${slug}`
  }
  return `${window.location.origin}/f/${slug}`
}
