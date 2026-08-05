import { useMemo } from 'react'
import { ImportEvaluationsSection } from '../components/evaluation/ImportEvaluationsSection'
import { TrainingCard } from '../components/evaluation/TrainingCard'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { Stat } from '../components/ui/Stat'
import { useEvaluationData } from '../context/EvaluationDataContext'
import { buildUploadedTrainings } from '../lib/buildTrainingSummaries'

export function DashboardPage() {
  const { rows, stats, sourceLabel, hasUploads, isLoading, loadError } = useEvaluationData()

  const uploadedTrainings = useMemo(() => buildUploadedTrainings(rows), [rows])

  const namedEvaluators = rows.filter((row) => row.evaluator_name.trim()).length
  const optionalEvaluators = rows.length - namedEvaluators

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Upload evaluation CSV and browse uploaded trainings. Open a training to see its graphs and scores."
        action={
          <a
            href="#import"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep sm:w-auto"
          >
            Import CSV
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
          description="Upload a CSV above to see training titles, dates, and evaluator names."
        >
          <span className="sr-only">Waiting for import</span>
        </Section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Uploaded trainings"
              value={`${uploadedTrainings.length}`}
              delta="Grouped by title and date"
            />
            <Stat
              label="Total evaluations"
              value={`${stats.totalResponses}`}
              delta={sourceLabel}
              className="animate-rise-delay-1"
            />
            <Stat
              label="Named evaluators"
              value={`${namedEvaluators}`}
              delta="Evaluator name provided"
              className="animate-rise-delay-2"
            />
            <Stat
              label="Optional names"
              value={`${optionalEvaluators}`}
              delta="No evaluator name in form"
              className="animate-rise-delay-3 sm:col-span-2 xl:col-span-1"
            />
          </div>

          <Section
            title="Uploaded trainings"
            description="Each training has its own graphs and Parts I–V scores. Click View graphs to open one."
          >
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {uploadedTrainings.map((training) => (
                <TrainingCard
                  key={`${training.trainingTitle}-${training.trainingDate}`}
                  training={training}
                />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
