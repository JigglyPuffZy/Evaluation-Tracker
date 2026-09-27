import type { EvaluationStats } from '../../lib/computeEvaluationStats'
import { ScoreRing } from '../ui/ScoreRing'
import { DashboardHeroStat } from './DashboardHeroStat'

type DashboardHeroProps = {
  displayName: string
  stats: EvaluationStats
  trainingCount: number
  hasUploads: boolean
  isLoading: boolean
  sourceLabel: string
}

const icons = {
  programs: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18M8 4v16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  responses: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  positive: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
} as const

export function DashboardHero({
  displayName,
  stats,
  trainingCount,
  hasUploads,
  isLoading,
  sourceLabel,
}: DashboardHeroProps) {
  const firstName = displayName.split(' ')[0] ?? displayName
  const showScoreRing = hasUploads && !isLoading && stats.totalResponses > 0

  return (
    <header className="page-header dash-hero animate-rise overflow-hidden rounded-2xl sm:rounded-3xl">
      <div className="dash-hero-mesh pointer-events-none" aria-hidden="true" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        {/* Greeting row */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="dash-live-pill">
                <span className="dash-live-dot" />
                {isLoading ? 'Syncing' : hasUploads ? 'Live data' : 'Ready to import'}
              </span>
              <span className="type-body text-muted">{sourceLabel}</span>
            </div>

            <h1 className="type-title-lg mt-6 text-ink sm:text-[2rem] lg:text-[2.25rem]">
              {hasUploads ? (
                <>
                  Welcome back,{' '}
                  <span className="text-accent">{firstName}</span>
                </>
              ) : (
                <>
                  Training evaluation{' '}
                  <span className="text-accent">dashboard</span>
                </>
              )}
            </h1>

            <p className="type-body mt-4 max-w-xl leading-relaxed text-muted sm:text-[0.9375rem]">
              {hasUploads
                ? 'Track training quality, session performance, and participant sentiment in one workspace.'
                : 'Import your Google Form Excel file to unlock analytics, radar insights, and session breakdowns.'}
            </p>

            {!hasUploads ? (
              <a
                href="#import"
                className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep"
              >
                Import Excel
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            ) : null}
          </div>

          {showScoreRing ? (
            <div className="dash-hero-ring shrink-0 self-center lg:self-auto">
              <ScoreRing
                average={stats.overallAverage}
                percent={stats.overallPercent}
                size={132}
              />
              <p className="type-label mt-3 text-center text-muted">Overall average</p>
            </div>
          ) : null}
        </div>

        {/* Unified stats bar */}
        <div className="dash-hero-stats mt-10">
          <DashboardHeroStat
            label="Programs"
            value={isLoading ? '—' : String(trainingCount)}
            hint="Unique trainings"
            icon={icons.programs}
          />
          <DashboardHeroStat
            label="Responses"
            value={isLoading ? '—' : String(stats.totalResponses)}
            hint="Total evaluations"
            icon={icons.responses}
            highlight
          />
          <DashboardHeroStat
            label="Average score"
            value={isLoading ? '—' : stats.overallAverage.toFixed(1)}
            hint="Out of 4.0 scale"
            icon={icons.score}
          />
          <DashboardHeroStat
            label="Positive rate"
            value={isLoading ? '—' : `${stats.positivePercent}%`}
            hint="Score ≥ 3.0"
            icon={icons.positive}
            highlight
          />
        </div>
      </div>
    </header>
  )
}
