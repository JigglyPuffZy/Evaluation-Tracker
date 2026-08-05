import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { computeEvaluationStats, type EvaluationStats } from '../lib/computeEvaluationStats'
import { seedEvaluationRows } from '../data/uiDemo'
import type { EvaluationRow } from '../types/evaluation'

type EvaluationDataContextValue = {
  rows: EvaluationRow[]
  stats: EvaluationStats
  sourceLabel: string
  hasUploads: boolean
  replaceWithImport: (rows: EvaluationRow[], fileName: string) => void
  loadSampleData: () => void
  clearUploads: () => void
}

const EvaluationDataContext = createContext<EvaluationDataContextValue | null>(null)

export function EvaluationDataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<EvaluationRow[]>(seedEvaluationRows)
  const [sourceLabel, setSourceLabel] = useState('Dummy data (preview)')
  const [hasUploads, setHasUploads] = useState(true)

  const stats = useMemo(() => computeEvaluationStats(rows), [rows])

  const value = useMemo<EvaluationDataContextValue>(
    () => ({
      rows,
      stats,
      sourceLabel,
      hasUploads,
      replaceWithImport: (importedRows, fileName) => {
        setRows(importedRows)
        setSourceLabel(`Imported: ${fileName}`)
        setHasUploads(true)
      },
      loadSampleData: () => {
        setRows(seedEvaluationRows)
        setSourceLabel('Dummy data (preview)')
        setHasUploads(true)
      },
      clearUploads: () => {
        setRows([])
        setSourceLabel('No uploads yet')
        setHasUploads(false)
      },
    }),
    [rows, sourceLabel, stats, hasUploads],
  )

  return (
    <EvaluationDataContext.Provider value={value}>{children}</EvaluationDataContext.Provider>
  )
}

export function useEvaluationData() {
  const context = useContext(EvaluationDataContext)
  if (!context) {
    throw new Error('useEvaluationData must be used within EvaluationDataProvider.')
  }
  return context
}
