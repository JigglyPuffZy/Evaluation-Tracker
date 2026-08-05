import {
  EVALUATION_SECTIONS,
  RATING_BANDS,
  RATING_SCALE_MAX,
  type SectionId,
} from '../types/evaluation'
import type { EvaluationRow } from '../types/evaluation'
import { getRowOverallAverage, isPositiveRow } from './evaluationRow'

export type SectionStat = {
  id: SectionId
  label: string
  average: number
  percent: number
}

export type RatingDistribution = {
  score: number
  label: string
  count: number
  percent: number
}

export type TrainingStat = {
  trainingTitle: string
  responses: number
  sharePercent: number
  average: number
  percentOfScale: number
}

export type EvaluationStats = {
  totalResponses: number
  overallAverage: number
  overallPercent: number
  positivePercent: number
  sections: SectionStat[]
  ratingDistribution: RatingDistribution[]
  trainings: TrainingStat[]
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function round0(value: number): number {
  return Math.round(value)
}

export function computeEvaluationStats(rows: EvaluationRow[]): EvaluationStats {
  const totalResponses = rows.length

  if (totalResponses === 0) {
    return {
      totalResponses: 0,
      overallAverage: 0,
      overallPercent: 0,
      positivePercent: 0,
      sections: EVALUATION_SECTIONS.map((section) => ({
        id: section.id,
        label: section.title,
        average: 0,
        percent: 0,
      })),
      ratingDistribution: RATING_BANDS.map((band) => ({
        score: band.score,
        label: band.label,
        count: 0,
        percent: 0,
      })),
      trainings: [],
    }
  }

  const overallValues = rows.map((row) => getRowOverallAverage(row))
  const overallAverage = round1(average(overallValues))
  const overallPercent = round0((overallAverage / RATING_SCALE_MAX) * 100)
  const positiveCount = rows.filter((row) => isPositiveRow(row)).length
  const positivePercent = round0((positiveCount / totalResponses) * 100)

  const sections: SectionStat[] = EVALUATION_SECTIONS.map((section) => {
    const sectionAverages = rows.map((row) => {
      const sum = section.fields.reduce((total, key) => total + row[key], 0)
      return sum / section.fields.length
    })
    const avg = round1(average(sectionAverages))
    return {
      id: section.id,
      label: section.title,
      average: avg,
      percent: round0((avg / RATING_SCALE_MAX) * 100),
    }
  })

  const ratingDistribution: RatingDistribution[] = RATING_BANDS.map((band) => {
    const count = rows.filter((row) => Math.round(getRowOverallAverage(row)) === band.score).length
    return {
      score: band.score,
      label: band.label,
      count,
      percent: round0((count / totalResponses) * 100),
    }
  })

  const trainingTitles = [...new Set(rows.map((row) => row.training_title))]
  const trainings: TrainingStat[] = trainingTitles
    .map((trainingTitle) => {
      const trainingRows = rows.filter((row) => row.training_title === trainingTitle)
      const avg = round1(average(trainingRows.map((row) => getRowOverallAverage(row))))
      return {
        trainingTitle,
        responses: trainingRows.length,
        sharePercent: round0((trainingRows.length / totalResponses) * 100),
        average: avg,
        percentOfScale: round0((avg / RATING_SCALE_MAX) * 100),
      }
    })
    .sort((a, b) => b.responses - a.responses)

  return {
    totalResponses,
    overallAverage,
    overallPercent,
    positivePercent,
    sections,
    ratingDistribution,
    trainings,
  }
}
