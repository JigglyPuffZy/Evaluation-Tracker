import {
  RATING_FIELD_KEYS,
  RATING_SCALE_MAX,
  type EvaluationRow,
  type RatingFieldKey,
} from '../types/evaluation'

export function getRowRatings(row: EvaluationRow): number[] {
  return RATING_FIELD_KEYS.map((key) => row[key])
}

export function getRowOverallAverage(row: EvaluationRow): number {
  const ratings = getRowRatings(row)
  if (ratings.length === 0) {
    return 0
  }
  const sum = ratings.reduce((total, value) => total + value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

export function getRowOverallPercent(row: EvaluationRow): number {
  return Math.round((getRowOverallAverage(row) / RATING_SCALE_MAX) * 100)
}

export function isPositiveRow(row: EvaluationRow): boolean {
  return getRowOverallAverage(row) >= 3
}

export function formatEvaluatorName(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : 'Optional (not provided)'
}

export function getSectionAverage(row: EvaluationRow, fields: readonly RatingFieldKey[]): number {
  if (fields.length === 0) {
    return 0
  }
  const sum = fields.reduce((total, key) => total + row[key], 0)
  return Math.round((sum / fields.length) * 10) / 10
}
