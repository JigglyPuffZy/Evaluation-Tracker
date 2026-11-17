import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CsfBreakdownPanel } from '../components/feedback/CsfBreakdownPanel'
import {
  Icons,
  KpiCard,
  MeterBar,
  StatusPill,
  formatDate,
  formatScore,
  toneFor,
  toneSoft,
  toneText,
} from '../components/feedback/csfUi'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { computeCsfFormStats, type CsfFormStats } from '../lib/computeCsfFormStats'
import { fetchCsfResponsesRaw, fetchFeedbackForms } from '../lib/feedbackFormDb'
import { CSF_SQD_STATEMENTS } from '../types/csfForm'
import type { FeedbackFormRecord } from '../types/feedbackForm'

const buttonClass =
  'inline-flex h-9 items-center rounded-lg border border-line bg-card px-3 text-xs font-semibold text-ink transition hover:border-accent/40'

export function CsfFormDetailPage() {
  const { formId } = useParams<{ formId: string }>()
  const [form, setForm] = useState<FeedbackFormRecord | null>(null)
  const [stats, setStats] = useState<CsfFormStats>(() => computeCsfFormStats([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!formId) {
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const forms = await fetchFeedbackForms()
        const match = forms.find((item) => item.id === formId) ?? null
        if (cancelled) {
          return
        }
        if (!match || match.formType !== 'csf') {
          setForm(null)
          setError('CSF form not found.')
          return
        }
        setForm(match)
        const responses = await fetchCsfResponsesRaw(formId!)
        if (cancelled) {
          return
        }
        setStats(computeCsfFormStats(responses))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load CSF data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [formId])

  if (loading) {
    return <p className="text-sm text-muted">Loading CSF summary…</p>
  }

  if (error || !form) {
    return (
      <Section title="CSF form">
        <p className="text-sm text-warn" role="alert">
          {error || 'Form not found.'}
        </p>
        <Link to="/csf" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Back to Customer Satisfaction
        </Link>
      </Section>
    )
  }

  const meta = [formatDate(form.trainingDate), form.venue].filter(Boolean).join(' · ')

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Customer satisfaction"
        title={form.trainingTitle}
        description={`${stats.responseCount} response${stats.responseCount === 1 ? '' : 's'}${meta ? ` · ${meta}` : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill live={form.isPublished} />
            <Link to="/csf" className={buttonClass}>
              All CSF results
            </Link>
            <Link to="/forms" className={buttonClass}>
              Manage forms
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Responses"
          value={String(stats.responseCount)}
          caption="Completed CSF forms"
          icon={Icons.users}
        />
        <KpiCard
          label="Service quality (SQD)"
          value={formatScore(stats.avgSqd)}
          unit="/ 5"
          ratio={stats.avgSqd != null ? stats.avgSqd / 5 : null}
          tone={toneFor(stats.avgSqd)}
          caption="Average across all SQD statements"
          icon={Icons.star}
        />
        <KpiCard
          label="Overall satisfaction"
          value={formatScore(stats.avgOverall)}
          unit="/ 5"
          ratio={stats.avgOverall != null ? stats.avgOverall / 5 : null}
          tone={toneFor(stats.avgOverall)}
          caption="Average overall rating"
          icon={Icons.smile}
        />
        <KpiCard
          label="Likely to recommend"
          value={formatScore(stats.avgNps, 1)}
          unit="/ 10"
          ratio={stats.avgNps != null ? stats.avgNps / 10 : null}
          tone={toneFor(stats.avgNps, 10)}
          caption="Average recommendation score"
          icon={Icons.thumb}
        />
      </div>

      {stats.responseCount > 0 ? (
        <section aria-label="Respondent breakdown" className="space-y-4">
          <SectionHeading
            title="Respondent breakdown"
            description="Who answered, and how they rated their experience."
          />
          <CsfBreakdownPanel breakdowns={stats.breakdowns} responseCount={stats.responseCount} />
        </section>
      ) : null}

      <Section
        title="Service quality dimensions"
        description="Average rating per statement, 1 (strongly disagree) to 5 (strongly agree). N/A answers are excluded."
      >
        {stats.responseCount === 0 ? (
          <p className="text-sm text-muted">
            No responses yet. Share the form link from the Forms page to start collecting ratings.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {CSF_SQD_STATEMENTS.map((statement) => {
              const avg = stats.sqdByStatement[statement.id]
              const tone = toneFor(avg)
              return (
                <li
                  key={statement.id}
                  className="grid gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)_5rem] sm:items-center"
                >
                  <span
                    className={[
                      'inline-flex h-7 w-fit items-center justify-center rounded-md px-2 text-[11px] font-bold tracking-wide',
                      toneSoft(tone),
                    ].join(' ')}
                  >
                    {statement.id.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-ink">{statement.label}</p>
                    <MeterBar ratio={avg != null ? avg / 5 : null} tone={tone} className="mt-2" />
                  </div>
                  <p
                    className={[
                      'text-sm font-bold tabular-nums sm:text-right',
                      toneText(tone),
                    ].join(' ')}
                  >
                    {avg != null ? avg.toFixed(2) : 'No data'}
                    {avg != null ? <span className="ml-0.5 text-xs font-medium text-muted">/5</span> : null}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}
