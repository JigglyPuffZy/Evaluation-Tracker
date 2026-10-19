import { CSF_SQD_STATEMENTS, type CsfSubmissionDraft } from '../types/csfForm'

export type CsfFormStats = {
  responseCount: number
  avgSqd: number | null
  sqdPercent: number | null
  avgNps: number | null
  sqdByStatement: Record<string, number | null>
}

function isCsfDraft(value: unknown): value is CsfSubmissionDraft {
  return typeof value === 'object' && value !== null && 'sqd' in value
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
      sqdByStatement: Object.fromEntries(CSF_SQD_STATEMENTS.map((item) => [item.id, null])),
    }
  }

  const allSqdValues: number[] = []
  const sqdByStatement: Record<string, number[]> = Object.fromEntries(
    CSF_SQD_STATEMENTS.map((item) => [item.id, [] as number[]]),
  )
  const npsValues: number[] = []

  for (const draft of drafts) {
    for (const statement of CSF_SQD_STATEMENTS) {
      const value = draft.sqd[statement.id]
      if (typeof value === 'number') {
        allSqdValues.push(value)
        sqdByStatement[statement.id].push(value)
      }
    }
    if (typeof draft.recommendScore === 'number') {
      npsValues.push(draft.recommendScore)
    }
  }

  const avgSqd =
    allSqdValues.length > 0
      ? allSqdValues.reduce((sum, value) => sum + value, 0) / allSqdValues.length
      : null

  const avgNps =
    npsValues.length > 0 ? npsValues.reduce((sum, value) => sum + value, 0) / npsValues.length : null

  const sqdByStatementAvg = Object.fromEntries(
    CSF_SQD_STATEMENTS.map((item) => {
      const values = sqdByStatement[item.id]
      if (values.length === 0) {
        return [item.id, null]
      }
      return [item.id, values.reduce((sum, value) => sum + value, 0) / values.length]
    }),
  ) as Record<string, number | null>

  return {
    responseCount,
    avgSqd,
    sqdPercent: avgSqd != null ? (avgSqd / 5) * 100 : null,
    avgNps,
    sqdByStatement: sqdByStatementAvg,
  }
}
