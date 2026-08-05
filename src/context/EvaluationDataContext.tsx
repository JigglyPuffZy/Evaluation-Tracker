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
} from '../lib/evaluationDb'
import type { EvaluationRow } from '../types/evaluation'
import { useAuth } from './AuthContext'

type EvaluationDataContextValue = {
  rows: EvaluationRow[]
  stats: EvaluationStats
  sourceLabel: string
  hasUploads: boolean
  isLoading: boolean
  loadError: string
  replaceWithImport: (rows: EvaluationRow[], fileName: string) => Promise<void>
  loadSampleData: () => void
  clearUploads: () => Promise<void>
  refreshFromDatabase: () => Promise<void>
}

const EvaluationDataContext = createContext<EvaluationDataContextValue | null>(null)

export function EvaluationDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [rows, setRows] = useState<EvaluationRow[]>([])
  const [sourceLabel, setSourceLabel] = useState('Loading from database…')
  const [hasUploads, setHasUploads] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  useEffect(() => {
    if (!isAuthenticated) {
      setRows([])
      setHasUploads(false)
      setSourceLabel('Sign in to load evaluations')
      setIsLoading(false)
      setLoadError('')
      return
    }

    void refreshFromDatabase()
  }, [isAuthenticated, refreshFromDatabase])

  const stats = useMemo(() => computeEvaluationStats(rows), [rows])

  const value = useMemo<EvaluationDataContextValue>(
    () => ({
      rows,
      stats,
      sourceLabel,
      hasUploads,
      isLoading,
      loadError,
      replaceWithImport: async (importedRows, fileName) => {
        await insertEvaluationsToSupabase(importedRows, fileName, user?.id)
        await refreshFromDatabase()
        setSourceLabel(`Imported: ${fileName}`)
      },
      loadSampleData: () => {
        void refreshFromDatabase()
      },
      clearUploads: async () => {
        await deleteAllEvaluationsFromSupabase()
        setRows([])
        setSourceLabel('No uploads yet')
        setHasUploads(false)
      },
      refreshFromDatabase,
    }),
    [
      rows,
      stats,
      sourceLabel,
      hasUploads,
      isLoading,
      loadError,
      user?.id,
      refreshFromDatabase,
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
