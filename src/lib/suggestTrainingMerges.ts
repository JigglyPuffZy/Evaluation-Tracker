import type { EvaluationRow } from '../types/evaluation'
import {
  normalizeTrainingTitleForGrouping,
  pickCanonicalTrainingTitle,
} from './normalizeTrainingTitle'

export type TrainingTitleVariant = {
  title: string
  responses: number
}

export type TrainingMergeSuggestion = {
  key: string
  variants: TrainingTitleVariant[]
  suggestedCanonical: string
  totalResponses: number
}

export function getDistinctTrainingTitles(rows: EvaluationRow[]): TrainingTitleVariant[] {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const title = row.training_title.trim()
    if (!title) {
      continue
    }
    counts.set(title, (counts.get(title) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([title, responses]) => ({ title, responses }))
    .sort((a, b) => b.responses - a.responses || a.title.localeCompare(b.title))
}

/** Raw training titles that belong to a multi-variant (duplicate spelling) group. */
export function getDuplicateTrainingTitleSet(rows: EvaluationRow[]): Set<string> {
  const titles = new Set<string>()

  for (const group of suggestTrainingMergeGroups(rows)) {
    for (const variant of group.variants) {
      titles.add(variant.title)
    }
  }

  return titles
}

export function isDuplicateTrainingTitle(title: string, duplicateTitles: Set<string>): boolean {
  return duplicateTitles.has(title.trim())
}

export function suggestTrainingMergeGroups(rows: EvaluationRow[]): TrainingMergeSuggestion[] {
  const titles = getDistinctTrainingTitles(rows)
  const grouped = new Map<string, TrainingTitleVariant[]>()

  for (const item of titles) {
    const key = normalizeTrainingTitleForGrouping(item.title)
    if (!key) {
      continue
    }
    const bucket = grouped.get(key) ?? []
    bucket.push(item)
    grouped.set(key, bucket)
  }

  return [...grouped.entries()]
    .filter(([, variants]) => variants.length > 1)
    .map(([key, variants]) => {
      const sorted = [...variants].sort((a, b) => b.responses - a.responses)
      return {
        key,
        variants: sorted,
        suggestedCanonical: pickCanonicalTrainingTitle(sorted.map((item) => item.title)),
        totalResponses: sorted.reduce((sum, item) => sum + item.responses, 0),
      }
    })
    .sort((a, b) => b.totalResponses - a.totalResponses)
}
