import type { CsfBreakdowns, CsfCount } from '../../lib/computeCsfFormStats'
import { MeterBar } from './csfUi'

const LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  internal: 'Internal',
  external: 'External',
  unspecified: 'Not specified',
  cc1_a: 'Knows the CC and saw it',
  cc1_b: 'Knows the CC, did not see it',
  cc1_c: 'Learned of the CC when seeing it',
  cc1_d: 'Does not know the CC',
}

function labelFor(key: string): string {
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card-surface flex min-w-0 flex-col rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function CountList({
  title,
  hint,
  items,
  total,
}: {
  title: string
  hint?: string
  items: CsfCount[]
  total: number
}) {
  return (
    <Card title={title} hint={hint}>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="space-y-3.5">
          {items.map((item) => {
            const ratio = total > 0 ? item.count / total : 0
            return (
              <li key={item.key} className="min-w-0">
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink" title={labelFor(item.key)}>
                    {labelFor(item.key)}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-muted">
                    {item.count} · {Math.round(ratio * 100)}%
                  </span>
                </div>
                <MeterBar ratio={ratio} />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function ScoreDistribution({
  title,
  hint,
  counts,
}: {
  title: string
  hint?: string
  counts: number[]
}) {
  const max = Math.max(1, ...counts)
  const total = counts.reduce((sum, count) => sum + count, 0)
  return (
    <Card title={title} hint={hint}>
      {total === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <div className="flex h-36 items-stretch gap-1.5" role="img" aria-label={title}>
          {counts.map((count, index) => (
            <div key={index} className="flex min-w-0 flex-1 flex-col items-center">
              <span className="h-4 text-[10px] font-semibold tabular-nums text-muted">
                {count > 0 ? count : ''}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent-deep to-accent"
                  style={{
                    height: count > 0 ? `${Math.max(6, (count / max) * 100)}%` : '3px',
                    opacity: count > 0 ? 1 : 0.25,
                  }}
                />
              </div>
              <span className="mt-1.5 h-4 text-[11px] font-medium text-muted">{index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function CsfBreakdownPanel({
  breakdowns,
  responseCount,
}: {
  breakdowns: CsfBreakdowns
  responseCount: number
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ScoreDistribution
        title="Overall satisfaction"
        hint="Number of clients per rating, 1 (poor) to 5 (excellent)"
        counts={breakdowns.overall}
      />
      <ScoreDistribution
        title="Likelihood to recommend"
        hint="Number of clients per score, 1 to 10"
        counts={breakdowns.recommend}
      />
      <CountList title="Client type" items={breakdowns.clientType} total={responseCount} />
      <CountList title="Sex" items={breakdowns.sex} total={responseCount} />
      <CountList
        title="Client classification"
        items={breakdowns.classification}
        total={responseCount}
      />
      <CountList
        title="Citizen's Charter awareness"
        hint="CC1 — which best describes your awareness of our CC?"
        items={breakdowns.cc1}
        total={responseCount}
      />
    </div>
  )
}
