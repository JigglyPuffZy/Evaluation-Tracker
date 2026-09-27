import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEvaluationData } from '../../context/EvaluationDataContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function ImportHistoryPanel() {
  const { canDeleteBatch } = useAuth()
  const { importBatches, isLoadingBatches, deleteBatch, refreshImportBatches } = useEvaluationData()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleDelete(batchId: string, fileName: string) {
    const confirmed = window.confirm(
      `Remove import "${fileName}" and all evaluations from that upload? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setPendingId(batchId)
    setError('')
    try {
      await deleteBatch(batchId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete import batch.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-3 border-t border-line/60 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Import history</p>
          <p className="text-xs text-muted">Recent uploads stored in Supabase</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshImportBatches()}
          className="text-xs font-medium text-accent hover:text-accent-deep"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-xs text-warn" role="alert">
          {error}
        </p>
      ) : null}

      {isLoadingBatches ? (
        <p className="text-sm text-muted">Loading history…</p>
      ) : importBatches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
          No imports yet. Upload an Excel file to see history here.
        </p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {importBatches.map((batch) => (
            <li
              key={batch.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{batch.fileName}</p>
                <p className="mt-0.5 text-xs text-muted">{formatWhen(batch.createdAt)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{batch.rowCount} rows</Badge>
                  <Badge tone="accent">{batch.source}</Badge>
                </div>
              </div>
              {canDeleteBatch ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-warn hover:bg-warn-soft"
                  disabled={pendingId === batch.id}
                  onClick={() => void handleDelete(batch.id, batch.fileName)}
                >
                  {pendingId === batch.id ? 'Removing…' : 'Undo'}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
