import { Link } from 'react-router-dom'
import type { DashboardCsfFormSummary } from '../../types/feedbackForm'
import { MeterBar, StatusPill, formatDate, formatScore, toneFor, toneText } from './csfUi'

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface/70 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-base font-bold tabular-nums text-ink">
        {value}
        {unit ? <span className="ml-0.5 text-[11px] font-medium text-muted">{unit}</span> : null}
      </p>
    </div>
  )
}

export function CsfFormCard({ form }: { form: DashboardCsfFormSummary }) {
  const { stats } = form
  const path = `/csf/${form.id}`
  const hasRatings = stats.responseCount > 0 && stats.avgSqd != null
  const tone = toneFor(stats.avgSqd)
  const meta = [formatDate(form.trainingDate), form.venue].filter(Boolean).join(' · ')

  return (
    <article className="card-surface card-surface-hover accent-top-line flex h-full min-w-0 flex-col rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-kicker text-accent">Customer satisfaction</p>
          <h3 className="mt-1.5 break-words text-lg font-semibold leading-snug text-ink">
            <Link to={path} className="transition hover:text-accent">
              {form.trainingTitle}
            </Link>
          </h3>
          {meta ? <p className="mt-1 truncate text-xs text-muted">{meta}</p> : null}
        </div>
        <StatusPill live={form.isPublished} />
      </div>

      <div className="mt-6">
        {hasRatings ? (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className={['text-4xl font-bold tabular-nums leading-none', toneText(tone)].join(' ')}>
                {formatScore(stats.avgSqd)}
              </span>
              <span className="text-sm font-medium text-muted">/ 5 average SQD rating</span>
            </p>
            <MeterBar ratio={stats.avgSqd! / 5} tone={tone} className="mt-3" />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-line px-4 py-5 text-center">
            <p className="text-sm font-medium text-ink">No responses yet</p>
            <p className="mt-0.5 text-xs text-muted">Share the form link to start collecting ratings.</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniStat label="Responses" value={String(stats.responseCount)} />
        <MiniStat
          label="Overall"
          value={stats.avgOverall != null ? stats.avgOverall.toFixed(1) : '—'}
          unit={stats.avgOverall != null ? '/5' : undefined}
        />
        <MiniStat
          label="Recommend"
          value={stats.avgNps != null ? stats.avgNps.toFixed(1) : '—'}
          unit={stats.avgNps != null ? '/10' : undefined}
        />
      </div>

      <div className="mt-auto pt-5">
        <Link
          to={path}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-accent-soft px-3 text-sm font-semibold text-accent-deep transition hover:bg-accent hover:text-white"
        >
          View full report
        </Link>
      </div>
    </article>
  )
}
