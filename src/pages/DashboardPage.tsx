import { useMemo, useState } from 'react'
import { DashboardFilters, type DashboardFilter } from '../components/dashboard/DashboardFilters'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { DashboardTrainingTile } from '../components/dashboard/DashboardTrainingTile'
import { FeaturesHelpPanel } from '../components/dashboard/FeaturesHelpPanel'
import { MergeTrainingsPanel } from '../components/evaluation/MergeTrainingsPanel'
import { ImportEvaluationsSection } from '../components/evaluation/ImportEvaluationsSection'
import { SectionHeading } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useEvaluationData } from '../context/EvaluationDataContext'
import { buildTrainingSummariesByTitle } from '../lib/buildTrainingSummaries'

function matchesScoreFilter(average: number, filter: DashboardFilter): boolean {
  if (filter === 'strong') {
    return average >= 3.5
  }
  if (filter === 'attention') {
    return average < 3.0
  }
  return true
}

export function DashboardPage() {
  const { user } = useAuth()
  const { rows, stats, sourceLabel, hasUploads, isLoading, loadError } = useEvaluationData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DashboardFilter>('all')

  const uploadedTrainings = useMemo(() => buildTrainingSummariesByTitle(rows), [rows])

  const duplicateProgramCount = useMemo(
    () => uploadedTrainings.filter((training) => training.titleVariantCount > 1).length,
    [uploadedTrainings],
  )

  const filteredTrainings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return uploadedTrainings.filter((training) => {
      const matchesSearch =
        query.length === 0 ||
        training.trainingTitle.toLowerCase().includes(query) ||
        training.venue.toLowerCase().includes(query)

      if (filter === 'duplicates') {
        return matchesSearch && training.titleVariantCount > 1
      }

      return matchesSearch && matchesScoreFilter(training.average, filter)
    })
  }, [uploadedTrainings, search, filter])

  return (
    <div className="dash-page relative space-y-6 pb-10 sm:space-y-8">
      <DashboardHero
        displayName={user?.displayName ?? 'Trainer'}
        stats={stats}
        trainingCount={uploadedTrainings.length}
        hasUploads={hasUploads}
        isLoading={isLoading}
        sourceLabel={sourceLabel}
      />

      <FeaturesHelpPanel />

      {hasUploads ? <MergeTrainingsPanel /> : null}

      {loadError ? (
        <p
          className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn"
          role="alert"
        >
          {loadError}. Run <code className="text-xs">supabase/setup.sql</code> in Supabase SQL
          Editor, then refresh.
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:gap-8">
        <section aria-labelledby="programs-heading" className="min-w-0 space-y-4">
          <SectionHeading
            title={hasUploads ? 'Training analytics' : 'Awaiting your first upload'}
            description={
              hasUploads
                ? 'One card per training title with consolidated scores across all sessions.'
                : 'Import a Google Form Excel file to populate this section.'
            }
            action={
              hasUploads ? (
                <span className="meta-pill">
                  {uploadedTrainings.length} program{uploadedTrainings.length === 1 ? '' : 's'}
                </span>
              ) : undefined
            }
          />

          {hasUploads && rows.length > 0 ? (
            <DashboardFilters
              search={search}
              filter={filter}
              onSearchChange={setSearch}
              onFilterChange={setFilter}
              resultCount={filteredTrainings.length}
              totalCount={uploadedTrainings.length}
              duplicateCount={duplicateProgramCount}
            />
          ) : null}

          {!hasUploads || rows.length === 0 ? (
            <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 px-6 py-16 text-center sm:py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                  <path
                    d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="type-title-sm mt-5 text-ink">No evaluations yet</h3>
              <p className="type-body mt-2 max-w-md text-muted">
                Use the import panel on the right to upload your Google Form Excel responses.
              </p>
              <a
                href="#import"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-deep"
              >
                Go to import
              </a>
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-line/80 px-6 py-12 text-center">
              <p className="type-title-sm text-ink">No programs match your filters</p>
              <p className="type-body mt-2 text-muted">
                {filter === 'duplicates'
                  ? 'No duplicate spelling variants detected — titles look unique.'
                  : 'Try a different search term or filter.'}
              </p>
            </div>
          ) : (
            <div className="dash-bento-grid">
              {filteredTrainings.map((training, index) => (
                <DashboardTrainingTile
                  key={training.trainingTitle}
                  training={training}
                  featured={index === 0}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-24">
          <ImportEvaluationsSection variant="dock" />
        </aside>
      </div>
    </div>
  )
}
