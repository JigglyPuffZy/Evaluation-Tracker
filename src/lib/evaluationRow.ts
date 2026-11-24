import {
  RATING_FIELD_KEYS,
  type EvaluationRow,
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

export function isPositiveRow(row: EvaluationRow): boolean {
  return getRowOverallAverage(row) >= 3
}
