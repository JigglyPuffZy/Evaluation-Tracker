import { Link } from 'react-router-dom'
import { RATING_SCALE_MAX } from '../../types/evaluation'
import type { TrainingSummary } from '../../lib/buildTrainingSummaries'
import { ViewGraphsLink } from '../ui/NavLinks'
import { RatingStars } from '../ui/RatingStars'

type DashboardTrainingTileProps = {
  training: TrainingSummary
  featured?: boolean
  index?: number
}

function scoreTone(percent: number): string {
  if (percent >= 85) return 'dash-score-excellent'
  if (percent >= 70) return 'dash-score-good'
  if (percent >= 55) return 'dash-score-fair'
  return 'dash-score-low'
}

export function DashboardTrainingTile({
  training,
  featured = false,
  index = 0,
}: DashboardTrainingTileProps) {
  const path = `/programs/${encodeURIComponent(training.trainingTitle)}`
  const tone = scoreTone(training.percentOfScale)
  const hasTitleVariants = training.titleVariantCount > 1
  const hasMultipleVenues = training.venues.length > 1
  const hasMultipleSessions = training.dates.length > 1

  return (
    <article
      className={[
        'card-surface card-surface-hover accent-top-line animate-rise group relative flex flex-col overflow-hidden rounded-2xl',
        featured ? 'dash-tile-featured p-6 sm:p-7' : 'p-5',
        index === 1 ? 'animate-rise-delay-1' : index === 2 ? 'animate-rise-delay-2' : index >= 3 ? 'animate-rise-delay-3' : '',
        hasTitleVariants ? 'ring-1 ring-warn/25' : '',
      ].join(' ')}
    >
      <div className={`dash-tile-glow ${tone}`} aria-hidden="true" />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="type-kicker text-accent">Training program</p>
              {hasTitleVariants ? (
                <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
                  {training.titleVariantCount} title variants
                </span>
              ) : null}
            </div>
            <Link
              to={path}
              className={[
                'mt-2 block font-semibold leading-snug text-ink transition hover:text-accent',
                featured ? 'type-title-md' : 'type-title-sm',
              ].join(' ')}
            >
              {training.trainingTitle}
            </Link>
            {hasTitleVariants ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Combined {training.responses} responses across {training.dates.length} session
                {training.dates.length === 1 ? '' : 's'} and {training.venues.length} venue
                {training.venues.length === 1 ? '' : 's'} — same training, different spellings in
                the form.
              </p>
            ) : null}
          </div>

          <div className={`dash-score-badge ${tone}`}>
            <span className="type-title-sm tabular-nums leading-none text-inherit">
              {training.average.toFixed(1)}
            </span>
            <span className="text-[10px] font-medium text-muted">/ {RATING_SCALE_MAX}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasMultipleSessions ? (
            <span className="meta-pill">{training.dates.length} sessions</span>
          ) : training.trainingDate ? (
            <span className="meta-pill">{training.trainingDate}</span>
          ) : null}
          {hasMultipleVenues ? (
            <span className="meta-pill" title={training.venues.join(' · ')}>
              {training.venues.length} venues
            </span>
          ) : training.venue ? (
            <span className="meta-pill max-w-[14rem] truncate" title={training.venue}>
              {training.venue}
            </span>
          ) : null}
          <span className="meta-pill">
            {training.responses} response{training.responses === 1 ? '' : 's'}
          </span>
        </div>

        {hasMultipleVenues ? (
          <ul className="mt-3 space-y-1 border-t border-line/50 pt-3">
            {training.venues.slice(0, 3).map((venue) => (
              <li key={venue} className="truncate text-xs text-muted">
                · {venue}
              </li>
            ))}
            {training.venues.length > 3 ? (
              <li className="text-xs text-muted">· +{training.venues.length - 3} more</li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="type-label text-muted">Satisfaction</span>
            <span className="type-label tabular-nums text-ink">{training.percentOfScale}%</span>
          </div>
          <div className="dash-progress-track">
            <div
              className={`dash-progress-fill ${tone}`}
              style={{ width: `${training.percentOfScale}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-line/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <RatingStars score={training.average} max={RATING_SCALE_MAX} />
            <ViewGraphsLink
              to={path}
              className="h-9 w-full justify-center sm:w-auto sm:min-w-[9.5rem]"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
