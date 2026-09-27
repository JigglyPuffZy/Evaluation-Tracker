import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEvaluationData } from '../../context/EvaluationDataContext'
import {
  getDistinctTrainingTitles,
  suggestTrainingMergeGroups,
} from '../../lib/suggestTrainingMerges'
import { pickCanonicalTrainingTitle } from '../../lib/normalizeTrainingTitle'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function MergeTrainingsPanel() {
  const { canImport } = useAuth()
  const { rows, mergeTrainingTitles } = useEvaluationData()
  const [selectedTitles, setSelectedTitles] = useState<string[]>([])
  const [canonicalTitle, setCanonicalTitle] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const distinctTitles = useMemo(() => getDistinctTrainingTitles(rows), [rows])
  const suggestions = useMemo(() => suggestTrainingMergeGroups(rows), [rows])

  function toggleTitle(title: string) {
    setSelectedTitles((current) => {
      const next = current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]

      if (next.length > 0) {
        setCanonicalTitle(pickCanonicalTrainingTitle(next))
      }

      return next
    })
  }

  function describeVariant(title: string) {
    const variantRows = rows.filter((row) => row.training_title.trim() === title)
    const dates = [...new Set(variantRows.map((row) => row.training_date))]
    const venues = [...new Set(variantRows.map((row) => row.venue).filter(Boolean))]
    return { dates, venues }
  }

  function applySuggestion(variantTitles: string[], suggestedCanonical: string) {
    setSelectedTitles(variantTitles)
    setCanonicalTitle(suggestedCanonical)
    setOpen(true)
  }

  async function handleMerge() {
    if (selectedTitles.length < 2) {
      setError('Select at least 2 training titles to merge.')
      return
    }

    if (!canonicalTitle.trim()) {
      setError('Enter the merged training name.')
      return
    }

    setIsMerging(true)
    setError('')
    setMessage('')

    try {
      const updated = await mergeTrainingTitles(selectedTitles, canonicalTitle.trim())
      setMessage(`Merged ${updated} evaluation${updated === 1 ? '' : 's'} into “${canonicalTitle.trim()}”.`)
      setSelectedTitles([])
      setCanonicalTitle('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not merge trainings.')
    } finally {
      setIsMerging(false)
    }
  }

  if (!canImport || rows.length === 0) {
    return null
  }

  return (
    <section className="glass-panel rounded-2xl border border-line/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
        aria-expanded={open}
      >
        <div>
          <p className="type-kicker text-accent">Cleanup</p>
          <p className="type-title-sm mt-0.5 text-ink">Merge duplicate training names</p>
          <p className="type-body mt-1 text-muted">
            The dashboard already combines variants into one card. Use merge to fix titles in the
            database so reports and future imports stay clean — sessions and venues are kept.
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-accent">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-line/60 px-4 py-4 sm:px-5">
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">Suggested merges</p>
              {suggestions.map((group) => (
                <article
                  key={group.key}
                  className="rounded-xl border border-line bg-surface/60 p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{group.suggestedCanonical}</p>
                      <p className="mt-1 text-xs text-muted">
                        {group.variants.length} title variants · {group.totalResponses} responses
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.variants.map((variant) => {
                          const meta = describeVariant(variant.title)
                          return (
                            <li key={variant.title} className="text-xs text-muted">
                              <span className="font-medium text-ink-soft">{variant.title}</span>{' '}
                              <Badge tone="neutral">{variant.responses} responses</Badge>
                              <span className="mt-0.5 block">
                                {meta.dates.length} session{meta.dates.length === 1 ? '' : 's'} ·{' '}
                                {meta.venues.length} venue{meta.venues.length === 1 ? '' : 's'}
                                {meta.venues[0] ? ` · ${meta.venues[0]}` : ''}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        applySuggestion(
                          group.variants.map((item) => item.title),
                          group.suggestedCanonical,
                        )
                      }
                    >
                      Use this merge
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
              No automatic suggestions right now. Pick titles manually below.
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">Manual merge</p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-line bg-surface/40 p-3">
              {distinctTitles.map((item) => (
                <label
                  key={item.title}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-card"
                >
                  <input
                    type="checkbox"
                    checked={selectedTitles.includes(item.title)}
                    onChange={() => toggleTitle(item.title)}
                    className="login-checkbox mt-0.5"
                  />
                  <span className="min-w-0 flex-1 text-sm text-ink-soft">
                    {item.title}
                    <span className="ml-2 text-xs text-muted">({item.responses} responses)</span>
                  </span>
                </label>
              ))}
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Merged training name
              </span>
              <input
                type="text"
                value={canonicalTitle}
                onChange={(event) => setCanonicalTitle(event.target.value)}
                placeholder="e.g. Smart and Sustainable Community Program (SSCP) Roadmapping Workshop"
                className="mt-1.5 h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-lg border border-good/25 bg-good-soft px-3 py-2 text-sm text-good">
                {message}
              </p>
            ) : null}

            <Button
              onClick={() => void handleMerge()}
              disabled={isMerging || selectedTitles.length < 2}
            >
              {isMerging
                ? 'Merging…'
                : `Merge ${selectedTitles.length} titles into one program`}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
