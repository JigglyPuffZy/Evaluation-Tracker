import type { EvaluationRow } from '../types/evaluation'
import { getRowOverallAverage } from './evaluationRow'
import {
  normalizeTrainingTitle,
  normalizeTrainingTitleForGrouping,
  pickCanonicalTrainingTitle,
} from './normalizeTrainingTitle'
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
  /** How many different spellings were combined into this card (1 = clean). */
  titleVariantCount: number
  rawTitles: string[]
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
  const rawTitles = [...new Set(trainingRows.map((row) => row.training_title.trim()).filter(Boolean))]

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
    titleVariantCount: rawTitles.length,
    rawTitles,
  }
}

function groupRowsByGroupingKey(rows: EvaluationRow[]): Map<string, EvaluationRow[]> {
  const grouped = new Map<string, EvaluationRow[]>()

  for (const row of rows) {
    const key = normalizeTrainingTitleForGrouping(row.training_title)
    const existing = grouped.get(key) ?? []
    existing.push(row)
    grouped.set(key, existing)
  }

  return grouped
}

/** One card per program — merges spelling variants (SAMRT/SMART/Smart) into one summary. */
export function buildTrainingSummariesByTitle(rows: EvaluationRow[]): TrainingSummary[] {
  return [...groupRowsByGroupingKey(rows).entries()]
    .map(([, trainingRows]) => {
      const canonicalTitle = pickCanonicalTrainingTitle(trainingRows.map((row) => row.training_title))
      return summarizeRows(canonicalTitle, trainingRows)
    })
    .sort((a, b) => b.responses - a.responses)
}

/** One entry per normalized title + date. */
export function buildUploadedTrainings(rows: EvaluationRow[]): TrainingSummary[] {
  const grouped = new Map<string, EvaluationRow[]>()

  for (const row of rows) {
    const key = `${normalizeTrainingTitleForGrouping(row.training_title)}|||${row.training_date}`
    const existing = grouped.get(key) ?? []
    existing.push(row)
    grouped.set(key, existing)
  }

  return [...grouped.entries()]
    .map(([, trainingRows]) => {
      const canonicalTitle = pickCanonicalTrainingTitle(trainingRows.map((row) => row.training_title))
      return summarizeRows(canonicalTitle, trainingRows)
    })
    .sort((a, b) => b.trainingDate.localeCompare(a.trainingDate))
}

/** All rows for a program card (includes every spelling variant in the group). */
export function filterRowsByTrainingTitle(rows: EvaluationRow[], trainingTitle: string): EvaluationRow[] {
  const target = normalizeTrainingTitleForGrouping(trainingTitle)
  return rows.filter((row) => normalizeTrainingTitleForGrouping(row.training_title) === target)
}

/** Strict match by single normalized spelling (used after DB title merge). */
export function filterRowsByExactTrainingTitle(rows: EvaluationRow[], trainingTitle: string): EvaluationRow[] {
  const target = normalizeTrainingTitle(trainingTitle)
  return rows.filter((row) => normalizeTrainingTitle(row.training_title) === target)
}
