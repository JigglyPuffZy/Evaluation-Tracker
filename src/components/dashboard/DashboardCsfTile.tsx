import { Link } from 'react-router-dom'
import type { DashboardCsfFormSummary } from '../../types/feedbackForm'
import { ScoreRing } from '../ui/ScoreRing'

type DashboardCsfTileProps = {
  form: DashboardCsfFormSummary
  index?: number
}

export function DashboardCsfTile({ form, index = 0 }: DashboardCsfTileProps) {
  const path = `/csf/${form.id}`
  const percent = form.stats.sqdPercent ?? 0
  const hasScores = form.stats.responseCount > 0 && form.stats.avgSqd != null

  return (
    <article
      className={[
        'card-surface card-surface-hover accent-top-line animate-rise group relative flex flex-col overflow-hidden rounded-2xl p-5',
        index === 1 ? 'animate-rise-delay-1' : index === 2 ? 'animate-rise-delay-2' : '',
      ].join(' ')}
    >
      <div className="relative flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="type-kicker text-accent">CSF · Online form</p>
          <Link
            to={path}
            className="type-title-sm mt-2 block font-semibold leading-snug text-ink transition hover:text-accent"
          >
            {form.trainingTitle}
          </Link>
          <p className="type-body mt-1.5 text-muted">
            {form.responseCount} CSF response{form.responseCount === 1 ? '' : 's'}
            {form.venue ? ` · ${form.venue}` : ''}
          </p>
          {form.stats.avgNps != null ? (
            <p className="mt-2 text-xs text-muted">
              Avg. recommendation:{' '}
              <span className="font-semibold text-ink">{form.stats.avgNps.toFixed(1)}</span> / 10
            </p>
          ) : null}
        </div>
        {hasScores ? (
          <ScoreRing average={form.stats.avgSqd!} percent={percent} max={5} size={96} />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-center text-[10px] font-medium text-muted">
            No ratings yet
          </div>
        )}
      </div>
      <Link
        to={path}
        className="mt-4 inline-flex text-xs font-semibold text-accent-deep transition group-hover:text-accent"
      >
        View CSF summary →
      </Link>
    </article>
  )
}
