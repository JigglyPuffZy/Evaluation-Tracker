import { Button } from '../ui/Button'

type ImportDuplicateDialogProps = {
  fileName: string
  totalRows: number
  duplicateCount: number
  uniqueCount: number
  onCancel: () => void
  onMergeDuplicates: () => void
  onSkipDuplicates: () => void
  onImportAll: () => void
  isSubmitting: boolean
}

export function ImportDuplicateDialog({
  fileName,
  totalRows,
  duplicateCount,
  uniqueCount,
  onCancel,
  onMergeDuplicates,
  onSkipDuplicates,
  onImportAll,
  isSubmitting,
}: ImportDuplicateDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-elevated">
        <p className="type-kicker text-accent">Duplicate check</p>
        <h2 id="duplicate-dialog-title" className="type-title-sm mt-1 text-ink">
          Some rows already exist
        </h2>
        <p className="type-body mt-3 text-muted">
          <strong className="font-medium text-ink">{fileName}</strong> has {totalRows} row
          {totalRows === 1 ? '' : 's'}. We matched {duplicateCount} duplicate
          {duplicateCount === 1 ? '' : 's'} by name, training, date, and contact number.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-good-soft px-3 py-2.5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-good">New rows</p>
            <p className="mt-1 text-2xl font-bold text-ink">{uniqueCount}</p>
          </div>
          <div className="rounded-xl bg-warn-soft px-3 py-2.5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-warn">Duplicates</p>
            <p className="mt-1 text-2xl font-bold text-ink">{duplicateCount}</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-accent-soft/70 px-3 py-2.5 text-sm text-ink-soft">
          <strong className="font-semibold text-ink">Merge (recommended):</strong> update existing
          rows with the new Excel data and import any new respondents.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onMergeDuplicates} disabled={isSubmitting}>
            {isSubmitting
              ? 'Merging…'
              : `Merge — update ${duplicateCount} + import ${uniqueCount} new`}
          </Button>
          <Button variant="secondary" onClick={onSkipDuplicates} disabled={isSubmitting || uniqueCount === 0}>
            {uniqueCount === 0
              ? 'Skip all duplicates'
              : `Import ${uniqueCount} new only (skip duplicates)`}
          </Button>
          <Button variant="ghost" onClick={onImportAll} disabled={isSubmitting}>
            Import all {totalRows} as separate rows
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
