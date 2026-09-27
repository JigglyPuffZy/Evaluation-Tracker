import type { EvaluationRow } from '../types/evaluation'
import { normalizeTrainingTitle } from './normalizeTrainingTitle'

function normalizeField(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Stable key to detect the same respondent for the same training session. */
export function evaluationFingerprint(
  row: Pick<EvaluationRow, 'evaluator_name' | 'training_title' | 'training_date' | 'contact_number'>,
): string {
  return [
    normalizeField(row.evaluator_name),
    normalizeTrainingTitle(row.training_title),
    row.training_date.trim(),
    normalizeField(row.contact_number),
  ].join('::')
}

export type ImportMergePlan = {
  toInsert: EvaluationRow[]
  toMerge: Array<{ existingId: string; incoming: EvaluationRow }>
  duplicateCount: number
  uniqueCount: number
}

export function planImportMerge(existing: EvaluationRow[], incoming: EvaluationRow[]): ImportMergePlan {
  const existingByFingerprint = new Map<string, EvaluationRow>()
  for (const row of existing) {
    existingByFingerprint.set(evaluationFingerprint(row), row)
  }

  const toInsert: EvaluationRow[] = []
  const toMerge: ImportMergePlan['toMerge'] = []
  const seenIncoming = new Set<string>()
  let duplicateCount = 0

  for (const row of incoming) {
    const fingerprint = evaluationFingerprint(row)

    if (seenIncoming.has(fingerprint)) {
      duplicateCount += 1
      continue
    }
    seenIncoming.add(fingerprint)

    const match = existingByFingerprint.get(fingerprint)
    if (match) {
      toMerge.push({ existingId: match.id, incoming: row })
      duplicateCount += 1
    } else {
      toInsert.push(row)
    }
  }

  return {
    toInsert,
    toMerge,
    duplicateCount,
    uniqueCount: toInsert.length,
  }
}
