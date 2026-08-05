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
  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="flex gap-3 rounded-xl border border-line/60 bg-surface/40 p-3.5 transition hover:border-accent/25 hover:bg-surface/70 sm:gap-4 sm:p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-accent">
            {SECTION_ROMAN[section.id] ?? '·'}
          </div>
          <div className="min-w-0 flex-1">
            <PercentageBar
              label={shortSectionTitle(section.label)}
              percent={section.percent}
              detail={`${section.average.toFixed(1)} / ${max}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
