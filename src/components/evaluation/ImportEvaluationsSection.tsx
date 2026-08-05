import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { useEvaluationData } from '../../context/EvaluationDataContext'
import { buildEvaluationCsv, buildSampleCsv, parseEvaluationCsv } from '../../lib/parseEvaluationCsv'

function downloadCsvFile(contents: string, fileName: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ImportEvaluationsSection() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    rows,
    stats,
    sourceLabel,
    replaceWithImport,
    loadSampleData,
    clearUploads,
  } = useEvaluationData()
  const [importError, setImportError] = useState('')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [lastImportedCount, setLastImportedCount] = useState<number | null>(null)

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload a .csv file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const result = parseEvaluationCsv(text)

      if (!result.ok) {
        setImportError(result.error)
        setImportWarnings([])
        setLastImportedCount(null)
        return
      }

      replaceWithImport(result.rows, file.name)
      setImportError('')
      setImportWarnings(result.warnings)
      setLastImportedCount(result.rows.length)
    }
    reader.onerror = () => {
      setImportError('Could not read the selected file.')
    }
    reader.readAsText(file)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
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

  return (
    <Section
      id="import"
      title="Import & export"
      description="Import a DOST Training Evaluation CSV file, or export the currently loaded records."
      action={
        <Button variant="secondary" size="sm" onClick={downloadTemplate}>
          Download template
        </Button>
      }
    >
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'rounded-2xl border border-dashed px-6 py-10 text-center transition',
          isDragging
            ? 'border-accent bg-accent-soft/60'
            : 'border-line bg-card/80 hover:border-accent/40',
        ].join(' ')}
      >
        <p className="text-xl font-semibold text-ink">Evaluation CSV</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Drag and drop a file here, or use Import to load evaluations into the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={openFilePicker}>Import CSV</Button>
          <Button variant="secondary" onClick={exportData} disabled={rows.length === 0}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={loadSampleData}>
            Load sample data
          </Button>
          <Button variant="ghost" onClick={clearUploads}>
            Clear data
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="accent">{sourceLabel}</Badge>
        <span className="text-muted">{stats.totalResponses} records loaded</span>
        {lastImportedCount !== null ? (
          <Badge tone="good">Last import: {lastImportedCount} rows</Badge>
        ) : null}
      </div>

      {importError ? (
        <p
          className="mt-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn"
          role="alert"
        >
          {importError}
        </p>
      ) : null}

      {importWarnings.length > 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          <p className="font-medium text-ink">Skipped rows</p>
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
    </Section>
  )
}
