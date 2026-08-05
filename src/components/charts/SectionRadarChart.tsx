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

type SectionRadarChartProps = {
  sections: SectionScore[]
  max?: number
}

function polarPoint(center: number, radius: number, index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  }
}

function ringPath(center: number, radius: number, total: number, scale = 1) {
  return Array.from({ length: total }, (_, index) => {
    const point = polarPoint(center, radius * scale, index, total)
    return `${point.x},${point.y}`
  }).join(' ')
}

export function SectionRadarChart({ sections, max = 4 }: SectionRadarChartProps) {
  const size = 360
  const center = size / 2
  const maxRadius = 100
  const total = sections.length

  const overallPercent = Math.round(
    sections.reduce((sum, section) => sum + section.percent, 0) / Math.max(sections.length, 1),
  )
  const overallAverage =
    sections.reduce((sum, section) => sum + section.average, 0) / Math.max(sections.length, 1)

  const dataPath = sections
    .map((section, index) => {
      const point = polarPoint(center, (section.percent / 100) * maxRadius, index, total)
      return `${point.x},${point.y}`
    })
    .join(' ')

  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-surface/50 px-4 py-3 text-center text-sm text-muted">
        <span className="font-medium text-ink">Radar chart</span> — each point is one part of the
        form. <span className="text-ink">Bigger shape = higher scores.</span>
      </p>

      <div className="mx-auto max-w-md rounded-2xl border border-line/60 bg-surface/30 p-6">
        <div className="relative aspect-square">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full"
            role="img"
            aria-label="Radar chart for Parts I to V"
          >
            {[0.25, 0.5, 0.75, 1].map((level) => (
              <polygon
                key={level}
                points={ringPath(center, maxRadius, total, level)}
                fill="none"
                stroke="var(--chart-track)"
                strokeWidth={1}
              />
            ))}

            {sections.map((_, index) => {
              const outer = polarPoint(center, maxRadius, index, total)
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="var(--chart-track)"
                  strokeWidth={1}
                />
              )
            })}

            <polygon
              points={dataPath}
              fill="var(--accent)"
              fillOpacity={0.2}
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {sections.map((section, index) => {
              const point = polarPoint(center, (section.percent / 100) * maxRadius, index, total)
              const badge = polarPoint(center, maxRadius + 28, index, total)
              return (
                <g key={section.id}>
                  <circle cx={point.x} cy={point.y} r={5} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
                  <circle cx={badge.x} cy={badge.y} r={16} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
                  <text
                    x={badge.x}
                    y={badge.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--accent-deep)"
                    fontSize={12}
                    fontWeight={700}
                  >
                    {SECTION_ROMAN[section.id]}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-line/60 bg-card px-5 py-4 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Overall</p>
              <p className="text-2xl font-bold tabular-nums text-ink">{overallPercent}%</p>
              <p className="text-xs tabular-nums text-muted">{overallAverage.toFixed(1)}/{max}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const fullTitle = shortSectionTitle(section.label)

          return (
          <div
            key={section.id}
            className="group relative flex items-center gap-3 rounded-xl border border-line/60 bg-surface/40 px-3 py-3"
            title={fullTitle}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
              {SECTION_ROMAN[section.id]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{fullTitle}</p>
              <p className="text-xs text-muted">
                <span className="font-semibold text-ink">{section.percent}%</span>
                {' · '}
                {section.average.toFixed(1)}/{max}
              </p>
            </div>
            <div
              className="pointer-events-none absolute bottom-full left-10 z-20 mb-2 hidden max-w-[16rem] rounded-lg border border-line/60 bg-card px-3 py-2 text-xs font-medium leading-snug text-ink shadow-[var(--shadow-card)] group-hover:block sm:max-w-[18rem]"
              role="tooltip"
            >
              {fullTitle}
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
