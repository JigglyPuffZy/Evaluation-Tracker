import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEvaluationData } from '../../context/EvaluationDataContext'
import { buildEvaluationCsv, buildSampleCsv, parseEvaluationCsv } from '../../lib/parseEvaluationCsv'
import { isExcelFileName, parseEvaluationExcel } from '../../lib/parseEvaluationExcel'
import type { ImportMode } from '../../context/EvaluationDataContext'
import type { EvaluationRow } from '../../types/evaluation'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { ImportDuplicateDialog } from './ImportDuplicateDialog'
import { ImportHistoryPanel } from './ImportHistoryPanel'

function downloadCsvFile(contents: string, fileName: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

type ImportEvaluationsSectionProps = {
  variant?: 'default' | 'dock'
}

type PendingImport = {
  fileName: string
  rows: EvaluationRow[]
  duplicateCount: number
  uniqueCount: number
}

export function ImportEvaluationsSection({ variant = 'default' }: ImportEvaluationsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { canImport, canClearAll, isReadOnly } = useAuth()
  const {
    rows,
    stats,
    sourceLabel,
    analyzeImport,
    commitImport,
    loadSampleData,
    clearUploads,
  } = useEvaluationData()

  const [importError, setImportError] = useState('')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)

  async function finalizeImport(fileName: string, importRows: EvaluationRow[], mode: ImportMode) {
    setIsImporting(true)
    setImportError('')
    setImportSuccess('')

    try {
      const result = await commitImport(importRows, fileName, { mode })
      setImportWarnings([])

      if (result.mergedCount > 0) {
        setImportSuccess(
          `Merged ${result.mergedCount} existing row${result.mergedCount === 1 ? '' : 's'} · imported ${result.importedCount} new row${result.importedCount === 1 ? '' : 's'}.`,
        )
      } else if (result.importedCount === 0 && result.skippedDuplicates > 0) {
        setImportSuccess('No new rows imported — all rows were duplicates.')
      } else if (result.skippedDuplicates > 0) {
        setImportSuccess(
          `Imported ${result.importedCount} row${result.importedCount === 1 ? '' : 's'} · skipped ${result.skippedDuplicates} duplicate${result.skippedDuplicates === 1 ? '' : 's'}.`,
        )
      } else {
        setImportSuccess(
          `Successfully imported ${result.importedCount} row${result.importedCount === 1 ? '' : 's'}.`,
        )
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Import failed. Check your Supabase connection.',
      )
    } finally {
      setIsImporting(false)
      setPendingImport(null)
    }
  }

  async function processFile(file: File) {
    if (!canImport) {
      setImportError('Your account is read-only. Contact an admin to import data.')
      return
    }

    const lowerName = file.name.toLowerCase()
    const isCsv = lowerName.endsWith('.csv')
    const isExcel = isExcelFileName(lowerName)

    if (!isCsv && !isExcel) {
      setImportError('Please upload a Google Form Excel file (.xlsx).')
      return
    }

    setIsImporting(true)
    setImportSuccess('')

    try {
      const result = isExcel
        ? parseEvaluationExcel(await file.arrayBuffer())
        : parseEvaluationCsv(await file.text())

      if (!result.ok) {
        setImportError(result.error)
        setImportWarnings([])
        return
      }

      setImportError('')
      setImportWarnings(result.warnings)

      const plan = analyzeImport(result.rows)

      if (plan.duplicateCount > 0) {
        setPendingImport({
          fileName: file.name,
          rows: result.rows,
          duplicateCount: plan.duplicateCount,
          uniqueCount: plan.uniqueCount,
        })
        setIsImporting(false)
        return
      }

      await finalizeImport(file.name, result.rows, 'skip')
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Import failed. Check your Supabase connection.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      void processFile(file)
    }
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      void processFile(file)
    }
  }

  function downloadTemplate() {
    downloadCsvFile(buildSampleCsv(), 'evaluation-import-template.csv')
  }

  function exportData() {
    if (rows.length === 0) {
      return
    }

    const date = new Date().toISOString().slice(0, 10)
    downloadCsvFile(buildEvaluationCsv(rows), `evaluation-export-${date}.csv`)
  }

  async function handleClearData() {
    if (!canClearAll) {
      setImportError('Only admins can clear all evaluation data.')
      return
    }

    if (rows.length > 0) {
      const date = new Date().toISOString().slice(0, 10)
      downloadCsvFile(buildEvaluationCsv(rows), `evaluation-backup-before-clear-${date}.csv`)
    }

    const confirmed = window.confirm(
      'Clear ALL evaluations from the database? A CSV backup was downloaded first.',
    )
    if (!confirmed) {
      return
    }

    try {
      await clearUploads()
      setImportSuccess('All evaluation data cleared.')
      setImportError('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not clear data.')
    }
  }

  const dropZone = (
    <div
      onDragOver={(event) => {
        if (!canImport) return
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        variant === 'dock' ? 'dash-import-drop' : 'rounded-2xl border border-dashed px-6 py-10 text-center',
        'transition',
        !canImport ? 'opacity-60' : '',
        isDragging
          ? 'border-accent bg-accent-soft/60'
          : variant === 'dock'
            ? 'border-line/70 bg-card/50 hover:border-accent/35'
            : 'border-line bg-card/80 hover:border-accent/40',
      ].join(' ')}
    >
      {variant === 'dock' ? (
        <>
          <div className="dash-import-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M12 16V4m0 0 4 4m-4-4-4 4M4 18h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="type-title-sm mt-4 text-ink">
            {canImport ? 'Drop Excel here' : 'Import disabled for viewers'}
          </p>
          <p className="type-body mt-1.5 text-muted">
            Google Forms → Responses → Download → .xlsx
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-ink">Google Form Excel</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Drag and drop your <strong className="font-medium text-ink">.xlsx</strong> responses file
            from Google Forms (Responses → Download → Microsoft Excel).
          </p>
        </>
      )}

      <div
        className={[
          'flex flex-wrap items-center gap-2',
          variant === 'dock' ? 'mt-5 justify-stretch' : 'mt-6 justify-center gap-3',
        ].join(' ')}
      >
        <Button
          onClick={openFilePicker}
          disabled={isImporting || !canImport}
          className={variant === 'dock' ? 'w-full' : undefined}
        >
          {isImporting ? 'Importing…' : 'Import Excel'}
        </Button>
        {variant === 'dock' ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={exportData} disabled={rows.length === 0}>
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void loadSampleData()}>
              Refresh
            </Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={exportData} disabled={rows.length === 0}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => void loadSampleData()}>
              Refresh data
            </Button>
            {canClearAll ? (
              <Button variant="ghost" onClick={() => void handleClearData()}>
                Clear data
              </Button>
            ) : null}
          </>
        )}
      </div>

      {variant === 'dock' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-4 text-xs">
          <button
            type="button"
            onClick={downloadTemplate}
            className="font-medium text-accent transition hover:text-accent-deep"
          >
            Download template
          </button>
          {canClearAll ? (
            <button
              type="button"
              onClick={() => void handleClearData()}
              className="text-muted transition hover:text-warn"
            >
              Clear data
            </button>
          ) : null}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )

  const meta = (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="accent">{sourceLabel}</Badge>
        <span className="text-muted">{stats.totalResponses} records</span>
        {isReadOnly ? <Badge tone="warn">Read-only</Badge> : null}
      </div>

      {importSuccess ? (
        <p className="rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-sm text-good" role="status">
          {importSuccess}
        </p>
      ) : null}

      {importError ? (
        <p
          className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn"
          role="alert"
        >
          {importError}
        </p>
      ) : null}

      {importWarnings.length > 0 ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          <p className="font-medium text-ink">Validation report — skipped rows</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {importWarnings.slice(0, 5).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          {importWarnings.length > 5 ? (
            <p className="mt-2">+{importWarnings.length - 5} more warnings</p>
          ) : null}
        </div>
      ) : null}
    </>
  )

  const duplicateDialog = pendingImport ? (
    <ImportDuplicateDialog
      fileName={pendingImport.fileName}
      totalRows={pendingImport.rows.length}
      duplicateCount={pendingImport.duplicateCount}
      uniqueCount={pendingImport.uniqueCount}
      isSubmitting={isImporting}
      onCancel={() => {
        setPendingImport(null)
        setIsImporting(false)
      }}
      onMergeDuplicates={() =>
        void finalizeImport(pendingImport.fileName, pendingImport.rows, 'merge')
      }
      onSkipDuplicates={() =>
        void finalizeImport(pendingImport.fileName, pendingImport.rows, 'skip')
      }
      onImportAll={() => void finalizeImport(pendingImport.fileName, pendingImport.rows, 'all')}
    />
  ) : null

  if (variant === 'dock') {
    return (
      <>
        {duplicateDialog}
        <div id="import" className="dash-import-dock space-y-4">
          <div>
            <p className="type-kicker text-accent">Import</p>
            <h2 className="type-title-sm mt-1 text-ink">Import & export</h2>
            <p className="type-body mt-1.5 text-muted">
              Upload Google Form Excel responses, review duplicates, and manage import history.
            </p>
          </div>
          {dropZone}
          {meta}
          <ImportHistoryPanel />
        </div>
      </>
    )
  }

  return (
    <>
      {duplicateDialog}
      <Section
        id="import"
        title="Import & export"
        description="Import the Google Form Excel export (.xlsx), or export the currently loaded records."
        action={
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            Download template
          </Button>
        }
      >
        {dropZone}
        <div className="mt-4 space-y-4">
          {meta}
          <ImportHistoryPanel />
        </div>
      </Section>
    </>
  )
}
