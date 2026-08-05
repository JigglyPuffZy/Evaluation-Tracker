import type { EvaluationRow } from '../types/evaluation'
import { getRowOverallAverage } from './evaluationRow'
import { RATING_SCALE_MAX } from '../types/evaluation'

export type TrainingSummary = {
  trainingTitle: string
  trainingDate: string
  dates: string[]
  venue: string
  venues: string[]
  evaluators: string[]
  responses: number
  average: number
  percentOfScale: number
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function round0(value: number): number {
  return Math.round(value)
}

function summarizeRows(title: string, trainingRows: EvaluationRow[]): TrainingSummary {
  const averageSum = trainingRows.reduce((sum, row) => sum + getRowOverallAverage(row), 0)
  const average = round1(averageSum / trainingRows.length)
  const dates = [...new Set(trainingRows.map((row) => row.training_date))].sort((a, b) =>
    b.localeCompare(a),
  )
  const venues = [...new Set(trainingRows.map((row) => row.venue).filter(Boolean))]

  return {
    trainingTitle: title,
    trainingDate: dates[0] ?? '',
    dates,
    venue: venues[0] ?? '',
    venues,
    evaluators: trainingRows
      .map((row) => row.evaluator_name.trim())
      .filter((name) => name.length > 0),
    responses: trainingRows.length,
    average,
    percentOfScale: round0((average / RATING_SCALE_MAX) * 100),
  }
}

/** One entry per training title + date (dashboard cards). */
export function buildUploadedTrainings(rows: EvaluationRow[]): TrainingSummary[] {
  const grouped = new Map<string, EvaluationRow[]>()

  for (const row of rows) {
    const key = `${row.training_title}|||${row.training_date}`
    const existing = grouped.get(key) ?? []
    existing.push(row)
    grouped.set(key, existing)
  }

  return [...grouped.entries()]
    .map(([, trainingRows]) => summarizeRows(trainingRows[0].training_title, trainingRows))
    .sort((a, b) => b.trainingDate.localeCompare(a.trainingDate))
}

/** One entry per training title (trainings page). */
export function buildTrainingSummariesByTitle(rows: EvaluationRow[]): TrainingSummary[] {
  const titles = [...new Set(rows.map((row) => row.training_title))]

  return titles
    .map((title) => summarizeRows(title, rows.filter((row) => row.training_title === title)))
    .sort((a, b) => b.responses - a.responses)
}
