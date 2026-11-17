import { PercentageBar } from '../charts/PercentageBar'
import type { CsfBreakdowns, CsfCount } from '../../lib/computeCsfFormStats'
import { CSF_CC1_OPTIONS } from '../../types/csfForm'

const LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  internal: 'Internal',
  external: 'External',
  unspecified: 'Not specified',
}

function labelFor(key: string): string {
  const cc1 = CSF_CC1_OPTIONS.find((option) => option.id === key)
  if (cc1) {
    return cc1.label
  }
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function CountList({ title, items, total }: { title: string; items: CsfCount[]; total: number }) {
  return (
    <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => {
            const percent = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <li key={item.key}>
                <PercentageBar
                  label={labelFor(item.key)}
                  percent={percent}
                  detail={`${item.count}`}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ScoreDistribution({
  title,
  counts,
  firstScore = 1,
}: {
  title: string
  counts: number[]
  firstScore?: number
}) {
  const max = Math.max(1, ...counts)
  return (
    <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-4 flex h-28 items-end gap-1.5" role="img" aria-label={title}>
        {counts.map((count, index) => (
          <div key={index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-muted">{count}</span>
            <div
              className="w-full rounded-t bg-accent"
              style={{ height: `${Math.max(count > 0 ? 6 : 2, (count / max) * 100)}%`, opacity: count > 0 ? 1 : 0.2 }}
            />
            <span className="text-[10px] text-muted">{index + firstScore}</span>
          </div>
        ))}
      </div>
    </div>
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
    <div className="grid gap-4 md:grid-cols-2">
      <ScoreDistribution title="Overall satisfaction (1–5)" counts={breakdowns.overall} />
      <ScoreDistribution title="Likelihood to recommend (1–10)" counts={breakdowns.recommend} />
      <CountList title="Client type" items={breakdowns.clientType} total={responseCount} />
      <CountList title="Sex" items={breakdowns.sex} total={responseCount} />
      <CountList
        title="Client classification"
        items={breakdowns.classification}
        total={responseCount}
      />
      <CountList title="Citizen's Charter awareness (CC1)" items={breakdowns.cc1} total={responseCount} />
    </div>
  )
}
