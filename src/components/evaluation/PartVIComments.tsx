import { Badge } from '../ui/Badge'
import { PART_VI_SECTION } from '../../types/evaluation'
import type { EvaluationRow } from '../../types/evaluation'
import { formatEvaluatorName } from '../../lib/evaluationRow'

type PartVICommentsProps = {
  rows: EvaluationRow[]
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return '?'
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function QuoteIcon() {
  return (
    <svg className="h-5 w-5 text-accent/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.17 6A5.001 5.001 0 0 0 2 11c0 2.76 2.24 5 5 5 .55 0 1-.45 1-1v-1.08c-.61-.21-1.16-.55-1.6-1A3.99 3.99 0 0 1 4 11c0-1.66 1.34-3 3-3 .37 0 .73.07 1.07.19L7.17 6Zm10 0A5.001 5.001 0 0 0 12 11c0 2.76 2.24 5 5 5 .55 0 1-.45 1-1v-1.08c-.61-.21-1.16-.55-1.6-1A3.99 3.99 0 0 1 14 11c0-1.66 1.34-3 3-3 .37 0 .73.07 1.07.19L17.17 6Z" />
    </svg>
  )
}

function FieldIcon({ type }: { type: 'improvement' | 'suggestions' }) {
  if (type === 'improvement') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 3.5 12.5 8l4.5.5-3.5 3 1 4.5L10 14l-4.5 2 1-4.5-3.5-3 4.5-.5L10 3.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3.5a4.5 4.5 0 0 0-2.2 8.4V14h4.4v-2.1A4.5 4.5 0 0 0 10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.5 16.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PartVIComments({ rows }: PartVICommentsProps) {
  const withComments = rows.filter(
    (row) => row.areas_for_improvement.trim() || row.future_suggestions.trim(),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/20 bg-accent-soft/30 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <QuoteIcon />
          <span>Open-ended feedback from the DOST evaluation form</span>
        </div>
        <Badge tone="accent">
          {withComments.length} of {rows.length} with comments
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const displayName = formatEvaluatorName(row.evaluator_name)
          const hasContent =
            row.areas_for_improvement.trim().length > 0 ||
            row.future_suggestions.trim().length > 0

          return (
            <article
              key={row.id}
              className={[
                'part-vi-card overflow-hidden rounded-2xl',
                hasContent ? 'part-vi-card-filled' : 'part-vi-card-empty',
              ].join(' ')}
            >
              <div className="flex items-start gap-3 border-b border-line/50 px-4 py-3.5 sm:px-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent"
                  aria-hidden="true"
                >
                  {getInitials(row.evaluator_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{displayName}</p>
                  <p className="mt-0.5 text-xs text-muted">{row.training_date}</p>
                </div>
                {!hasContent ? <Badge tone="neutral">No comments</Badge> : null}
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {PART_VI_SECTION.fields.map((field, index) => {
                  const value = row[field.key].trim()
                  const iconType = index === 0 ? 'improvement' : 'suggestions'

                  return (
                    <div key={field.key} className="part-vi-field rounded-xl p-3.5 sm:p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          <FieldIcon type={iconType} />
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {field.label}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft break-words">
                        {value || 'No response provided.'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
