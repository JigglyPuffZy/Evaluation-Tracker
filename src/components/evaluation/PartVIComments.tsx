import { Badge } from '../ui/Badge'
import { PART_VI_SECTION } from '../../types/evaluation'
import type { EvaluationRow } from '../../types/evaluation'

type PartVICommentsProps = {
  rows: EvaluationRow[]
}

function isMeaningfulComment(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return !['none', 'n/a', 'na', '-', '.', '~', 'n/a.', 'none.'].includes(normalized)
}

function collectUniqueComments(rows: EvaluationRow[], key: 'areas_for_improvement' | 'future_suggestions') {
  const seen = new Set<string>()
  const comments: string[] = []

  for (const row of rows) {
    const value = row[key].trim()
    if (!isMeaningfulComment(value)) {
      continue
    }

    const fingerprint = value.toLowerCase()
    if (seen.has(fingerprint)) {
      continue
    }

    seen.add(fingerprint)
    comments.push(value)
  }

  return comments
}

function QuoteIcon() {
  return (
    <svg className="h-5 w-5 text-accent/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.17 6A5.001 5.001 0 0 0 2 11c0 2.76 2.24 5 5 5 .55 0 1-.45 1-1v-1.08c-.61-.21-1.16-.55-1.6-1A3.99 3.99 0 0 1 4 11c0-1.66 1.34-3 3-3 .37 0 .73.07 1.07.19L7.17 6Zm10 0A5.001 5.001 0 0 0 12 11c0 2.76 2.24 5 5 5 .55 0 1-.45 1-1v-1.08c-.61-.21-1.16-.55-1.6-1A3.99 3.99 0 0 1 14 11c0-1.66 1.34-3 3-3 .37 0 .73.07 1.07.19L17.17 6Z" />
    </svg>
  )
}

export function PartVIComments({ rows }: PartVICommentsProps) {
  const improvements = collectUniqueComments(rows, 'areas_for_improvement')
  const suggestions = collectUniqueComments(rows, 'future_suggestions')
  const withComments = rows.filter(
    (row) => isMeaningfulComment(row.areas_for_improvement) || isMeaningfulComment(row.future_suggestions),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/20 bg-accent-soft/30 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <QuoteIcon />
          <span>Consolidated open-ended feedback for this training</span>
        </div>
        <Badge tone="accent">
          {withComments.length} of {rows.length} responses with comments
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {PART_VI_SECTION.fields.map((field) => {
          const comments =
            field.key === 'areas_for_improvement' ? improvements : suggestions

          return (
            <article key={field.key} className="part-vi-card part-vi-card-filled overflow-hidden rounded-2xl">
              <div className="border-b border-line/50 px-4 py-3.5 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{field.label}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {comments.length} unique response{comments.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                {comments.length > 0 ? (
                  <ul className="space-y-3">
                    {comments.map((comment) => (
                      <li
                        key={comment}
                        className="part-vi-field rounded-xl px-3.5 py-3 text-sm leading-relaxed text-ink-soft break-words sm:px-4 sm:py-3.5"
                      >
                        {comment}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No responses provided for this field.</p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
