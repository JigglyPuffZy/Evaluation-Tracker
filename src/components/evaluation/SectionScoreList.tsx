import { PercentageBar } from '../charts/PercentageBar'

const SECTION_ROMAN: Record<string, string> = {
  part1: 'I',
  part2: 'II',
  part3: 'III',
  part4: 'IV',
  part5: 'V',
}

function shortSectionTitle(label: string): string {
  const parts = label.split(' — ')
  return parts.length > 1 ? parts[1] : label
}

type SectionScore = {
  id: string
  label: string
  average: number
  percent: number
}

type SectionScoreListProps = {
  sections: SectionScore[]
  max?: number
}

export function SectionScoreList({ sections, max = 4 }: SectionScoreListProps) {
  const overallPercent = Math.round(
    sections.reduce((sum, section) => sum + section.percent, 0) / Math.max(sections.length, 1),
  )
  const overallAverage =
    sections.reduce((sum, section) => sum + section.average, 0) / Math.max(sections.length, 1)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-accent/25 bg-accent-soft/30 px-5 py-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Average score — Parts I to V
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums text-ink">{overallPercent}%</p>
        <p className="mt-1 text-sm text-muted">
          {overallAverage.toFixed(1)} out of {max} on the evaluation form
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <article
            key={section.id}
            className="rounded-xl border border-line/60 bg-surface/40 px-4 py-4 sm:px-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-accent">
                  {SECTION_ROMAN[section.id]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Part {SECTION_ROMAN[section.id]}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-ink">
                    {shortSectionTitle(section.label)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums text-ink">{section.percent}%</p>
                <p className="text-xs tabular-nums text-muted">
                  {section.average.toFixed(1)} / {max}
                </p>
              </div>
            </div>
            <PercentageBar
              label="Section score"
              percent={section.percent}
              detail={`${section.average.toFixed(1)} / ${max}`}
            />
          </article>
        ))}
      </div>
    </div>
  )
}
