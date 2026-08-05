import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrainingCard } from '../components/evaluation/TrainingCard'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { Stat } from '../components/ui/Stat'
import { useEvaluationData } from '../context/EvaluationDataContext'
import { buildTrainingSummariesByTitle } from '../lib/buildTrainingSummaries'

export function ProgramsPage() {
  const { rows, stats, sourceLabel, hasUploads } = useEvaluationData()

  const trainings = useMemo(() => buildTrainingSummariesByTitle(rows), [rows])
  const namedEvaluators = rows.filter((row) => row.evaluator_name.trim()).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Trainings"
        description="Browse uploaded trainings and open each one for graphs, Parts I–V scores, and Part VI comments."
      />

      {!hasUploads || rows.length === 0 ? (
        <Section
          title="No uploaded trainings yet"
          description="Import evaluation data first. Training titles will appear here from your CSV."
        >
          <Link
            to={{ pathname: '/', hash: 'import' }}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep sm:w-auto"
          >
            Import on dashboard
          </Link>
        </Section>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{sourceLabel}</Badge>
            <span className="text-sm text-muted">{trainings.length} trainings loaded</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Stat
              label="Trainings"
              value={`${trainings.length}`}
              delta="Unique training titles"
            />
            <Stat
              label="Total evaluations"
              value={`${stats.totalResponses}`}
              delta="Across all trainings"
              className="animate-rise-delay-1"
            />
            <Stat
              label="Named evaluators"
              value={`${namedEvaluators}`}
              delta="Optional names allowed"
              className="animate-rise-delay-2 sm:col-span-2 xl:col-span-1"
            />
          </div>

          <Section
            title="Uploaded trainings"
            description="Tap a training to view its full evaluation results."
          >
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {trainings.map((training) => (
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
