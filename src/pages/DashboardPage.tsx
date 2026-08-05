import { useMemo } from 'react'
import { ImportEvaluationsSection } from '../components/evaluation/ImportEvaluationsSection'
import { TrainingCard } from '../components/evaluation/TrainingCard'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { useEvaluationData } from '../context/EvaluationDataContext'
import { buildTrainingSummariesByTitle } from '../lib/buildTrainingSummaries'

export function DashboardPage() {
  const { rows, sourceLabel, hasUploads, isLoading, loadError } = useEvaluationData()

  const uploadedTrainings = useMemo(() => buildTrainingSummariesByTitle(rows), [rows])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Upload evaluation Excel and browse uploaded trainings. Open a training to see its graphs and scores."
        action={
          <a
            href="#import"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep sm:w-auto"
          >
            Import Excel
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={hasUploads ? 'accent' : 'neutral'}>{sourceLabel}</Badge>
        {isLoading ? <Badge tone="neutral">Loading…</Badge> : null}
      </div>

      {loadError ? (
        <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
          {loadError}. Run <code className="text-xs">supabase/setup.sql</code> in Supabase SQL Editor, then refresh.
        </p>
      ) : null}

      <ImportEvaluationsSection />

      {!hasUploads || rows.length === 0 ? (
        <Section
          title="No evaluation results yet"
          description="Upload a Google Form Excel file above to see training titles, dates, and evaluator names."
        >
          <span className="sr-only">Waiting for import</span>
        </Section>
      ) : (
        <>
          <Section
            title="Uploaded trainings"
            description="One card per training title with consolidated scores across all sessions."
          >
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {uploadedTrainings.map((training) => (
                <TrainingCard
                  key={training.trainingTitle}
                  training={training}
                  linkTitle
                  showEvaluators={false}
                />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
