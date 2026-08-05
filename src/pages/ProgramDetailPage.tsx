import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DonutChart } from '../components/charts/DonutChart'
import { PercentageBar } from '../components/charts/PercentageBar'
import { VerticalBarChart } from '../components/charts/VerticalBarChart'
import { SectionScoreList } from '../components/evaluation/SectionScoreList'
import { Badge } from '../components/ui/Badge'
import { BackLink } from '../components/ui/NavLinks'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Section } from '../components/ui/Section'
import { useEvaluationData } from '../context/EvaluationDataContext'
import { computeEvaluationStats } from '../lib/computeEvaluationStats'
import { getRowOverallAverage } from '../lib/evaluationRow'
import { PartVIComments } from '../components/evaluation/PartVIComments'
import { PART_VI_SECTION, RATING_SCALE_MAX, type EvaluationRow } from '../types/evaluation'

function computeDateStats(rows: EvaluationRow[]) {
  if (rows.length === 0) {
    return []
  }

  const dates = [...new Set(rows.map((row) => row.training_date))]

  return dates
    .map((date) => {
      const dateRows = rows.filter((row) => row.training_date === date)
      const averages = dateRows.map((row) => getRowOverallAverage(row))
      const average = averages.reduce((sum, value) => sum + value, 0) / averages.length
      const positiveCount = averages.filter((value) => value >= 3).length

      return {
        date,
        venue: dateRows[0]?.venue ?? '',
        responses: dateRows.length,
        average: Math.round(average * 10) / 10,
        percentOfScale: Math.round((average / RATING_SCALE_MAX) * 100),
        positivePercent: Math.round((positiveCount / dateRows.length) * 100),
        sharePercent: Math.round((dateRows.length / rows.length) * 100),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17s5-4.5 5-9a5 5 0 1 0-10 0c0 4.5 5 9 5 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="1.75" fill="currentColor" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.5 16.5c0-2.5 2.2-4 5-4s5 1.5 5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17.5 16.5c0-2-1.5-3.2-3.5-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>()
  const { rows, sourceLabel, hasUploads } = useEvaluationData()

  let trainingTitle = ''
  if (programId) {
    try {
      trainingTitle = decodeURIComponent(programId)
    } catch {
      trainingTitle = programId
    }
  }

  const trainingRows = useMemo(
    () => rows.filter((row) => row.training_title === trainingTitle),
    [rows, trainingTitle],
  )

  const stats = useMemo(() => computeEvaluationStats(trainingRows), [trainingRows])
  const dateStats = useMemo(() => computeDateStats(trainingRows), [trainingRows])

  const primaryDate = dateStats[0]

  if (!trainingTitle) {
    return <Navigate to="/" replace />
  }

  if (!hasUploads || rows.length === 0) {
    return (
      <div>
        <BackLink />
        <Section
          className="mt-6"
          title="No uploaded data"
          description="Import the Google Form Excel file first."
        >
          <Link
            to={{ pathname: '/', hash: 'import' }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep"
          >
            Go to import
          </Link>
        </Section>
      </div>
    )
  }

  const donutSlices = stats.ratingDistribution.map((item, index) => ({
    label: String(item.score),
    percent: item.percent,
    color: ['#0057b8', '#003d82', '#1a3a6b', '#5a6f8c'][index],
  }))

  return (
    <div className="space-y-6">
      <BackLink />

      {stats.totalResponses === 0 ? (
        <Section
          title="No evaluation data yet"
          description={`No imported rows match “${trainingTitle}”. Check the training title column in your Excel file.`}
        >
          <Link
            to={{ pathname: '/', hash: 'import' }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep"
          >
            Go to import
          </Link>
        </Section>
      ) : (
        <>
          <section className="training-hero page-header animate-rise overflow-hidden rounded-2xl">
            <div className="p-5 sm:p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="heading-accent hidden shrink-0 sm:block" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
                      Training results
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{sourceLabel}</Badge>
                      <Badge tone="neutral">4-point scale</Badge>
                    </div>

                    <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl">
                      {trainingTitle}
                    </h1>

                    <p className="mt-2.5 text-sm leading-relaxed text-muted">
                      DOST Training Evaluation results for this training only.
                    </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {primaryDate ? (
                      <span className="meta-pill">
                        <CalendarIcon />
                        {primaryDate.date}
                      </span>
                    ) : null}
                    {primaryDate?.venue ? (
                      <span className="meta-pill">
                        <PinIcon />
                        {primaryDate.venue}
                      </span>
                    ) : null}
                    <span className="meta-pill">
                      <UsersIcon />
                      {stats.totalResponses} evaluation{stats.totalResponses === 1 ? '' : 's'}
                    </span>
                  </div>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <ScoreRing
                    average={stats.overallAverage}
                    percent={stats.overallPercent}
                    max={RATING_SCALE_MAX}
                    size={128}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-line/60 pt-6">
                <div className="rounded-xl bg-surface/50 px-4 py-3 sm:max-w-xs">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Agree / Excellent
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-good">{stats.positivePercent}%</p>
                  <p className="text-xs text-muted">Scores 3–4</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Section
              title="Rating distribution"
              description="How evaluators scored this training on the 4-point scale."
            >
              <div className="rounded-xl bg-surface/40 p-4 md:p-5">
                <DonutChart
                  slices={donutSlices}
                  centerLabel="Agree+"
                  centerValue={`${stats.positivePercent}%`}
                />
              </div>
              <div className="mt-5 rounded-xl bg-surface/40 p-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
                  Score breakdown
                </p>
                <VerticalBarChart
                  items={stats.ratingDistribution.map((item) => ({
                    label: String(item.score),
                    value: item.percent,
                    display: `${item.percent}%`,
                  }))}
                />
              </div>
            </Section>

            <Section
              title="Parts I–V"
              description="Consolidated radar across Parts I–V. Comments are in Part VI below."
            >
              <SectionScoreList sections={stats.sections} max={RATING_SCALE_MAX} />
            </Section>
          </div>

          {dateStats.length > 1 ? (
            <Section
              title="Training dates"
              description="This training has multiple session dates in the uploaded data."
            >
              <div className="space-y-4">
                {dateStats.map((item) => (
                  <div key={item.date} className="card-surface rounded-xl p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">{item.date}</p>
                        <p className="text-xs text-muted">
                          {item.responses} evaluations · avg {item.average.toFixed(1)} · agree/excellent{' '}
                          {item.positivePercent}%
                        </p>
                        {item.venue ? <p className="text-xs text-muted">Venue: {item.venue}</p> : null}
                      </div>
                      <Badge tone="accent">{item.sharePercent}% of responses</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <PercentageBar label="Share within training" percent={item.sharePercent} tone="ink" />
                      <PercentageBar
                        label={`Score vs ${RATING_SCALE_MAX}.0 scale`}
                        percent={item.percentOfScale}
                        detail={`${item.average.toFixed(1)} avg`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <Section
            title={PART_VI_SECTION.title}
            description="Open-ended comments — not included in Parts I–V scores."
          >
            <PartVIComments rows={trainingRows} />
          </Section>
        </>
      )}
    </div>
  )
}
