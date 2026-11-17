import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CsfFormCard } from '../components/feedback/CsfFormCard'
import { Icons, KpiCard, formatScore, toneFor } from '../components/feedback/csfUi'
import { CsfBreakdownPanel } from '../components/feedback/CsfBreakdownPanel'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { fetchCsfFormSummaries } from '../lib/feedbackFormDb'
import type { CsfBreakdowns, CsfCount } from '../lib/computeCsfFormStats'
import type { DashboardCsfFormSummary } from '../types/feedbackForm'

function weightedAverage(
  forms: DashboardCsfFormSummary[],
  pick: (form: DashboardCsfFormSummary) => number | null,
): number | null {
  let sum = 0
  let weight = 0
  for (const form of forms) {
    const value = pick(form)
    if (value != null && form.stats.responseCount > 0) {
      sum += value * form.stats.responseCount
      weight += form.stats.responseCount
    }
  }
  return weight > 0 ? sum / weight : null
}

function mergeCounts(lists: CsfCount[][]): CsfCount[] {
  const map = new Map<string, number>()
  for (const list of lists) {
    for (const item of list) {
      map.set(item.key, (map.get(item.key) ?? 0) + item.count)
    }
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
}

function mergeBuckets(lists: number[][], length: number): number[] {
  return Array.from({ length }, (_, index) => lists.reduce((sum, list) => sum + (list[index] ?? 0), 0))
}

export function CustomerSatisfactionPage() {
  const [forms, setForms] = useState<DashboardCsfFormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchCsfFormSummaries()
        if (!cancelled) {
          setForms(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load customer satisfaction data.',
          )
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
  }, [])

  const totals = useMemo(() => {
    const responseCount = forms.reduce((sum, form) => sum + form.stats.responseCount, 0)
    const breakdowns: CsfBreakdowns = {
      sex: mergeCounts(forms.map((form) => form.stats.breakdowns.sex)),
      clientType: mergeCounts(forms.map((form) => form.stats.breakdowns.clientType)),
      classification: mergeCounts(forms.map((form) => form.stats.breakdowns.classification)),
      cc1: mergeCounts(forms.map((form) => form.stats.breakdowns.cc1)),
      recommend: mergeBuckets(forms.map((form) => form.stats.breakdowns.recommend), 10),
      overall: mergeBuckets(forms.map((form) => form.stats.breakdowns.overall), 5),
    }
    return {
      responseCount,
      avgSqd: weightedAverage(forms, (form) => form.stats.avgSqd),
      avgOverall: weightedAverage(forms, (form) => form.stats.avgOverall),
      avgNps: weightedAverage(forms, (form) => form.stats.avgNps),
      breakdowns,
    }
  }, [forms])

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Customer satisfaction"
        title="Customer Satisfaction Feedback"
        description="Client satisfaction results (QMS 06-F03). Kept separate from training evaluations."
        action={
          <Link
            to="/forms"
            className="inline-flex h-9 items-center rounded-lg border border-line bg-card px-3 text-xs font-semibold text-ink"
          >
            Manage forms
          </Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
          {error}. Run <code className="text-xs">supabase/feedback-forms-csf.sql</code> in the Supabase SQL
          Editor, then refresh.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading customer satisfaction data…</p>
      ) : forms.length === 0 && !error ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 px-6 py-16 text-center">
          <h2 className="type-title-sm text-ink">No customer satisfaction forms yet</h2>
          <p className="type-body mt-2 max-w-md text-muted">
            Create a Customer Satisfaction (CSF) form under Forms to get a shareable link and start
            collecting responses.
          </p>
          <Link
            to="/forms"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep"
          >
            Go to Forms
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total responses"
              value={String(totals.responseCount)}
              caption={`Across ${forms.length} form${forms.length === 1 ? '' : 's'}`}
              tone="accent"
              icon={Icons.users}
            />
            <KpiCard
              label="Service quality (SQD)"
              value={formatScore(totals.avgSqd)}
              unit="/ 5"
              ratio={totals.avgSqd != null ? totals.avgSqd / 5 : null}
              tone={toneFor(totals.avgSqd)}
              caption="Average across all SQD statements"
              icon={Icons.star}
            />
            <KpiCard
              label="Overall satisfaction"
              value={formatScore(totals.avgOverall)}
              unit="/ 5"
              ratio={totals.avgOverall != null ? totals.avgOverall / 5 : null}
              tone={toneFor(totals.avgOverall)}
              caption="Average overall rating given by clients"
              icon={Icons.smile}
            />
            <KpiCard
              label="Likely to recommend"
              value={formatScore(totals.avgNps, 1)}
              unit="/ 10"
              ratio={totals.avgNps != null ? totals.avgNps / 10 : null}
              tone={toneFor(totals.avgNps, 10)}
              caption="Average recommendation score"
              icon={Icons.thumb}
            />
          </div>

          <section aria-labelledby="csf-forms-heading" className="space-y-4">
            <SectionHeading
              title="CSF forms"
              description="One card per customer satisfaction form. Open a card for the full breakdown."
              action={<span className="meta-pill">{forms.length} form{forms.length === 1 ? '' : 's'}</span>}
            />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {forms.map((form) => (
                <CsfFormCard key={form.id} form={form} />
              ))}
            </div>
          </section>

          {totals.responseCount > 0 ? (
            <section aria-labelledby="csf-breakdown-heading" className="space-y-4">
              <SectionHeading
                title="All responses at a glance"
                description="Combined across every CSF form."
              />
              <CsfBreakdownPanel breakdowns={totals.breakdowns} responseCount={totals.responseCount} />
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
