import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { ViewGraphsLink } from '../ui/NavLinks'
import { RatingStars } from '../ui/RatingStars'
import { RATING_SCALE_MAX } from '../../types/evaluation'
import type { TrainingSummary } from '../../lib/buildTrainingSummaries'

type TrainingCardProps = {
  training: TrainingSummary
  showEvaluators?: boolean
  linkTitle?: boolean
}

export function TrainingCard({
  training,
  showEvaluators = true,
  linkTitle = false,
}: TrainingCardProps) {
  const path = `/programs/${encodeURIComponent(training.trainingTitle)}`

  return (
    <article className="card-surface card-surface-hover flex h-full flex-col rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {linkTitle ? (
            <Link
              to={path}
              className="text-base font-semibold leading-snug text-ink transition hover:text-accent sm:text-lg"
            >
              {training.trainingTitle}
            </Link>
          ) : (
            <h3 className="text-base font-semibold leading-snug text-ink sm:text-lg">
              {training.trainingTitle}
            </h3>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {training.dates.length > 1 ? (
              <span className="meta-pill">{training.dates.length} dates</span>
            ) : training.trainingDate ? (
              <span className="meta-pill">{training.trainingDate}</span>
            ) : null}
            {training.venue ? (
              <span className="meta-pill max-w-full truncate">{training.venue}</span>
            ) : null}
            <span className="meta-pill">
              {training.responses} evaluation{training.responses === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-center sm:h-12 sm:w-12">
          <span className="text-sm font-bold tabular-nums text-accent">
            {training.average.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted">/ {RATING_SCALE_MAX}</span>
        </div>
      </div>

      {showEvaluators ? (
        <div className="mt-4 min-h-[4.5rem] flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evaluators</p>
          {training.evaluators.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {training.evaluators.map((name) => (
                <li
                  key={name}
                  className="max-w-full truncate rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent-deep"
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Optional — no names provided</p>
          )}
        </div>
      ) : (
        <div className="flex-1" aria-hidden="true" />
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <RatingStars score={training.average} max={RATING_SCALE_MAX} />
          <Badge tone="good">{training.percentOfScale}%</Badge>
        </div>
        <ViewGraphsLink
          to={path}
          className="h-10 w-full justify-center sm:h-9 sm:w-auto sm:min-w-[9.5rem] sm:justify-center"
        />
      </div>
    </article>
  )
}
