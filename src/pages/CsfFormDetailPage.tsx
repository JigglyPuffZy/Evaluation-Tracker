import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { CSF_SQD_STATEMENTS } from '../types/csfForm'
import { computeCsfFormStats, type CsfFormStats } from '../lib/computeCsfFormStats'
import { fetchCsfResponsesRaw, fetchFeedbackForms } from '../lib/feedbackFormDb'
import type { FeedbackFormRecord } from '../types/feedbackForm'
import { PercentageBar } from '../components/charts/PercentageBar'

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
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Back to dashboard
        </Link>
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer satisfaction"
        title={form.trainingTitle}
        description={`${stats.responseCount} response${stats.responseCount === 1 ? '' : 's'} from the online CSF link.`}
        action={
          <Link
            to="/forms"
            className="inline-flex h-9 items-center rounded-lg border border-line bg-card px-3 text-xs font-semibold text-ink"
          >
            Manage forms
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Responses</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats.responseCount}</p>
        </div>
        <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg. SQD</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {stats.avgSqd != null ? `${stats.avgSqd.toFixed(2)} / 5` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg. NPS score</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {stats.avgNps != null ? `${stats.avgNps.toFixed(1)} / 10` : '—'}
          </p>
        </div>
      </div>

      <Section title="SQD criteria" description="Average rating per statement (1–5, N/A excluded).">
        {stats.responseCount === 0 ? (
          <p className="text-sm text-muted">Walang sagot pa. I-share ang link sa Forms page.</p>
        ) : (
          <ul className="space-y-4">
            {CSF_SQD_STATEMENTS.map((statement) => {
              const avg = stats.sqdByStatement[statement.id]
              const percent = avg != null ? (avg / 5) * 100 : 0
              return (
                <li key={statement.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-ink">
                      <span className="text-accent-deep">{statement.id.toUpperCase()}</span>{' '}
                      {statement.label}
                    </p>
                    <p className="text-xs font-semibold text-muted">
                      {avg != null ? `${avg.toFixed(2)} / 5` : 'No data'}
                    </p>
                  </div>
                  {avg != null ? (
                    <PercentageBar
                      label=""
                      percent={Math.round(percent)}
                      detail={`${avg.toFixed(2)} / 5`}
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}
