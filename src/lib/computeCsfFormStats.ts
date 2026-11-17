import { CSF_SQD_STATEMENTS, type CsfSubmissionDraft } from '../types/csfForm'

export type CsfCount = { key: string; count: number }

export type CsfBreakdowns = {
  sex: CsfCount[]
  clientType: CsfCount[]
  classification: CsfCount[]
  /** CC1 awareness — keys are option ids (cc1_a … cc1_d). */
  cc1: CsfCount[]
  /** Recommendation score 1–10 (index 0 = score 1). */
  recommend: number[]
  /** Overall satisfaction 1–5 (index 0 = score 1). */
  overall: number[]
}

export type CsfFormStats = {
  responseCount: number
  avgSqd: number | null
  sqdPercent: number | null
  avgNps: number | null
  /** Average overall satisfaction (sqd0), 1–5. */
  avgOverall: number | null
  sqdByStatement: Record<string, number | null>
  breakdowns: CsfBreakdowns
}

function isCsfDraft(value: unknown): value is CsfSubmissionDraft {
  return typeof value === 'object' && value !== null && 'sqd' in value
}

function tally(values: string[]): CsfCount[] {
  const map = new Map<string, number>()
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
}

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function emptyBreakdowns(): CsfBreakdowns {
  return {
    sex: [],
    clientType: [],
    classification: [],
    cc1: [],
    recommend: Array.from({ length: 10 }, () => 0),
    overall: Array.from({ length: 5 }, () => 0),
  }
}

export function computeCsfFormStats(responses: unknown[]): CsfFormStats {
  const drafts = responses.filter(isCsfDraft)
  const responseCount = drafts.length

  if (responseCount === 0) {
    return {
      responseCount: 0,
      avgSqd: null,
      sqdPercent: null,
      avgNps: null,
      avgOverall: null,
      sqdByStatement: Object.fromEntries(CSF_SQD_STATEMENTS.map((item) => [item.id, null])),
      breakdowns: emptyBreakdowns(),
    }
  }

  const allSqdValues: number[] = []
  const sqdByStatement: Record<string, number[]> = Object.fromEntries(
    CSF_SQD_STATEMENTS.map((item) => [item.id, [] as number[]]),
  )
  const npsValues: number[] = []
  const overallValues: number[] = []
  const sex: string[] = []
  const clientType: string[] = []
  const classification: string[] = []
  const cc1: string[] = []
  const breakdowns = emptyBreakdowns()

  for (const draft of drafts) {
    for (const statement of CSF_SQD_STATEMENTS) {
      const value = draft.sqd[statement.id]
      if (typeof value === 'number') {
        allSqdValues.push(value)
        sqdByStatement[statement.id].push(value)
      }
    }

    const overall = draft.sqd.sqd0
    if (typeof overall === 'number' && overall >= 1 && overall <= 5) {
      overallValues.push(overall)
      breakdowns.overall[overall - 1] += 1
    }

    if (typeof draft.recommendScore === 'number') {
      npsValues.push(draft.recommendScore)
      if (draft.recommendScore >= 1 && draft.recommendScore <= 10) {
        breakdowns.recommend[draft.recommendScore - 1] += 1
      }
    }

    sex.push(draft.sex || 'unspecified')
    clientType.push(draft.clientType || 'unspecified')
    cc1.push(draft.cc1 || 'unspecified')
    if (draft.clientClassifications?.length) {
      classification.push(...draft.clientClassifications)
    } else {
      classification.push('unspecified')
    }
  }

  breakdowns.sex = tally(sex)
  breakdowns.clientType = tally(clientType)
  breakdowns.classification = tally(classification)
  breakdowns.cc1 = tally(cc1)

  const avgSqd = average(allSqdValues)

  const sqdByStatementAvg = Object.fromEntries(
    CSF_SQD_STATEMENTS.map((item) => [item.id, average(sqdByStatement[item.id])]),
  ) as Record<string, number | null>

  return {
    responseCount,
    avgSqd,
    sqdPercent: avgSqd != null ? (avgSqd / 5) * 100 : null,
    avgNps: average(npsValues),
    avgOverall: average(overallValues),
    sqdByStatement: sqdByStatementAvg,
    breakdowns,
  }
}
