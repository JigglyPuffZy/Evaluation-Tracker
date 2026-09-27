import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { computeEvaluationStats, type EvaluationStats } from '../lib/computeEvaluationStats'
import {
  deleteAllEvaluationsFromSupabase,
  fetchEvaluationsFromSupabase,
  insertEvaluationsToSupabase,
  mergeImportToSupabase,
  mergeTrainingTitlesInSupabase,
} from '../lib/evaluationDb'
import { planImportMerge, type ImportMergePlan } from '../lib/importDuplicates'
import {
  deleteImportBatch,
  fetchImportBatches,
  type ImportBatchRecord,
} from '../lib/importBatchDb'
import type { EvaluationRow } from '../types/evaluation'
import { useAuth } from './AuthContext'

export type ImportMode = 'skip' | 'merge' | 'all'

export type ImportResult = {
  importedCount: number
  mergedCount: number
  skippedDuplicates: number
  fileName: string
}

type EvaluationDataContextValue = {
  rows: EvaluationRow[]
  stats: EvaluationStats
  sourceLabel: string
  hasUploads: boolean
  isLoading: boolean
  loadError: string
  importBatches: ImportBatchRecord[]
  isLoadingBatches: boolean
  analyzeImport: (incoming: EvaluationRow[]) => ImportMergePlan
  commitImport: (
    rows: EvaluationRow[],
    fileName: string,
    options?: { mode?: ImportMode },
  ) => Promise<ImportResult>
  mergeTrainingTitles: (sourceTitles: string[], canonicalTitle: string) => Promise<number>
  deleteBatch: (batchId: string) => Promise<void>
  loadSampleData: () => void
  clearUploads: (options?: { backupFirst?: boolean }) => Promise<void>
  refreshFromDatabase: () => Promise<void>
  refreshImportBatches: () => Promise<void>
}

const EvaluationDataContext = createContext<EvaluationDataContextValue | null>(null)

export function EvaluationDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [rows, setRows] = useState<EvaluationRow[]>([])
  const [sourceLabel, setSourceLabel] = useState('Loading from database…')
  const [hasUploads, setHasUploads] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [importBatches, setImportBatches] = useState<ImportBatchRecord[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)

  const refreshFromDatabase = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const data = await fetchEvaluationsFromSupabase()
      setRows(data)
      setHasUploads(data.length > 0)
      setSourceLabel(
        data.length > 0
          ? `Supabase — ${data.length} evaluation${data.length === 1 ? '' : 's'}`
          : 'Supabase — no evaluations yet',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load evaluations.'
      setLoadError(message)
      setRows([])
      setHasUploads(false)
      setSourceLabel('Database unavailable')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshImportBatches = useCallback(async () => {
    if (!isAuthenticated) {
      setImportBatches([])
      return
    }

    setIsLoadingBatches(true)
    try {
      const batches = await fetchImportBatches()
      setImportBatches(batches)
    } catch (error) {
      console.warn('Could not load import history:', error)
      setImportBatches([])
    } finally {
      setIsLoadingBatches(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setRows([])
      setHasUploads(false)
      setSourceLabel('Sign in to load evaluations')
      setIsLoading(false)
      setLoadError('')
      setImportBatches([])
      return
    }

    void refreshFromDatabase()
    void refreshImportBatches()
  }, [isAuthenticated, refreshFromDatabase, refreshImportBatches])

  const stats = useMemo(() => computeEvaluationStats(rows), [rows])

  const analyzeImport = useCallback(
    (incoming: EvaluationRow[]) => planImportMerge(rows, incoming),
    [rows],
  )

  const value = useMemo<EvaluationDataContextValue>(
    () => ({
      rows,
      stats,
      sourceLabel,
      hasUploads,
      isLoading,
      loadError,
      importBatches,
      isLoadingBatches,
      analyzeImport,
      commitImport: async (incomingRows, fileName, options) => {
        const mode = options?.mode ?? 'skip'
        const plan = planImportMerge(rows, incomingRows)

        if (mode === 'merge') {
          const { inserted, merged } = await mergeImportToSupabase(
            plan.toInsert,
            plan.toMerge,
            fileName,
            user?.id,
          )

          if (inserted === 0 && merged === 0) {
            return { importedCount: 0, mergedCount: 0, skippedDuplicates: plan.duplicateCount, fileName }
          }

          await refreshFromDatabase()
          await refreshImportBatches()
          setSourceLabel(`Merged import: ${fileName}`)

          return {
            importedCount: inserted,
            mergedCount: merged,
            skippedDuplicates: 0,
            fileName,
          }
        }

        if (mode === 'all') {
          if (incomingRows.length === 0) {
            return { importedCount: 0, mergedCount: 0, skippedDuplicates: 0, fileName }
          }

          await insertEvaluationsToSupabase(incomingRows, fileName, user?.id)
          await refreshFromDatabase()
          await refreshImportBatches()
          setSourceLabel(`Imported: ${fileName}`)

          return {
            importedCount: incomingRows.length,
            mergedCount: 0,
            skippedDuplicates: 0,
            fileName,
          }
        }

        if (plan.toInsert.length === 0) {
          return {
            importedCount: 0,
            mergedCount: 0,
            skippedDuplicates: plan.duplicateCount,
            fileName,
          }
        }

        await insertEvaluationsToSupabase(plan.toInsert, fileName, user?.id)
        await refreshFromDatabase()
        await refreshImportBatches()
        setSourceLabel(`Imported: ${fileName}`)

        return {
          importedCount: plan.toInsert.length,
          mergedCount: 0,
          skippedDuplicates: plan.duplicateCount,
          fileName,
        }
      },
      mergeTrainingTitles: async (sourceTitles, canonicalTitle) => {
        const updated = await mergeTrainingTitlesInSupabase(sourceTitles, canonicalTitle)
        await refreshFromDatabase()
        return updated
      },
      deleteBatch: async (batchId) => {
        await deleteImportBatch(batchId)
        await refreshFromDatabase()
        await refreshImportBatches()
      },
      loadSampleData: () => {
        void refreshFromDatabase()
        void refreshImportBatches()
      },
      clearUploads: async () => {
        await deleteAllEvaluationsFromSupabase()
        setRows([])
        setSourceLabel('No uploads yet')
        setHasUploads(false)
        await refreshImportBatches()
      },
      refreshFromDatabase,
      refreshImportBatches,
    }),
    [
      rows,
      stats,
      sourceLabel,
      hasUploads,
      isLoading,
      loadError,
      importBatches,
      isLoadingBatches,
      analyzeImport,
      user?.id,
      refreshFromDatabase,
      refreshImportBatches,
    ],
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
