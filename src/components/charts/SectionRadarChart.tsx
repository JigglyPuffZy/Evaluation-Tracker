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

function polarPoint(
  center: number,
  radius: number,
  index: number,
  total: number,
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  }
}

function polygonPath(center: number, radius: number, total: number, scale = 1): string {
  return Array.from({ length: total }, (_, index) => {
    const point = polarPoint(center, radius * scale, index, total)
    return `${point.x},${point.y}`
  }).join(' ')
}

function labelAnchor(index: number, total: number): 'start' | 'middle' | 'end' {
  const angle = ((Math.PI * 2 * index) / total - Math.PI / 2) * (180 / Math.PI)
  const normalized = ((angle % 360) + 360) % 360

  if (normalized > 30 && normalized < 150) {
    return 'start'
  }
  if (normalized > 210 && normalized < 330) {
    return 'end'
  }
  return 'middle'
}

export function SectionRadarChart({ sections, max = 4 }: SectionRadarChartProps) {
  const size = 420
  const center = size / 2
  const maxRadius = 108
  const labelRadius = maxRadius + 36
  const total = sections.length
  const gridLevels = [0.25, 0.5, 0.75, 1]

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
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/20 bg-accent-soft/25 px-4 py-3 text-sm text-ink-soft">
        <p className="font-medium text-ink">How to read this chart</p>
        <p className="mt-1 leading-relaxed">
          Each corner is one form section (Part I–V). The blue shape shows the score for that
          section — closer to the edge means a higher rating. The center shows the overall average
          across all five parts (scale 1–{max}, shown as % of maximum).
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <div className="relative">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Parts I to V section scores radar chart"
            className="overflow-visible"
          >
            {gridLevels.map((level) => (
              <g key={level}>
                <polygon
                  points={polygonPath(center, maxRadius, total, level)}
                  fill="none"
                  stroke="var(--chart-track)"
                  strokeWidth={1}
                />
                <text
                  x={center + 4}
                  y={center - maxRadius * level + (level === 1 ? -6 : 4)}
                  fill="var(--muted)"
                  fontSize={10}
                  fontWeight={500}
                >
                  {Math.round(level * 100)}%
                </text>
              </g>
            ))}

            {sections.map((section, index) => {
              const outer = polarPoint(center, maxRadius, index, total)
              const value = polarPoint(center, (section.percent / 100) * maxRadius, index, total)
              const labelPoint = polarPoint(center, labelRadius, index, total)
              const title = shortSectionTitle(section.label)
              const anchor = labelAnchor(index, total)

              return (
                <g key={section.id}>
                  <line
                    x1={center}
                    y1={center}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="var(--chart-track)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={value.x}
                    cy={value.y}
                    r={5}
                    fill="var(--accent)"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={value.x}
                    y={value.y - 10}
                    textAnchor="middle"
                    fill="var(--accent-deep)"
                    fontSize={11}
                    fontWeight={700}
                  >
                    {section.percent}%
                  </text>
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y - 5}
                    textAnchor={anchor}
                    fill="var(--accent)"
                    fontSize={12}
                    fontWeight={700}
                  >
                    Part {SECTION_ROMAN[section.id]}
                  </text>
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y + 10}
                    textAnchor={anchor}
                    fill="var(--ink-soft)"
                    fontSize={10}
                    fontWeight={500}
                  >
                    {title}
                  </text>
                </g>
              )
            })}

            <polygon
              points={dataPath}
              fill="var(--accent)"
              fillOpacity={0.16}
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Overall</p>
            <p className="text-3xl font-semibold tabular-nums text-ink">{overallPercent}%</p>
            <p className="text-sm tabular-nums text-muted">
              {overallAverage.toFixed(1)} / {max}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line/60">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-0 border-b border-line/60 bg-surface/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Part</span>
          <span>Section</span>
          <span className="text-right">Score</span>
        </div>
        <ul className="divide-y divide-line/50">
          {sections.map((section) => (
            <li
              key={section.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 text-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
                {SECTION_ROMAN[section.id]}
              </span>
              <span className="min-w-0 text-ink-soft">{shortSectionTitle(section.label)}</span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="font-semibold text-ink">{section.percent}%</span>
                <span className="ml-1.5 text-muted">
                  ({section.average.toFixed(1)}/{max})
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
