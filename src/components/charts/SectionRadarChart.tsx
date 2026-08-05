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

function axisLabelOffset(index: number, total: number): { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' } {
  const angle = ((Math.PI * 2 * index) / total - Math.PI / 2) * (180 / Math.PI)
  const normalized = ((angle % 360) + 360) % 360

  if (normalized >= 315 || normalized < 45) {
    return { dx: 0, dy: -8, anchor: 'middle' }
  }
  if (normalized >= 45 && normalized < 135) {
    return { dx: 10, dy: 4, anchor: 'start' }
  }
  if (normalized >= 135 && normalized < 225) {
    return { dx: 0, dy: 14, anchor: 'middle' }
  }
  return { dx: -10, dy: 4, anchor: 'end' }
}

export function SectionRadarChart({ sections, max = 4 }: SectionRadarChartProps) {
  const size = 480
  const center = size / 2
  const maxRadius = 92
  const labelRadius = maxRadius + 44
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
      <div className="rounded-2xl border border-line/60 bg-surface/30 p-4 sm:p-6">
        <div className="relative mx-auto aspect-square max-w-[420px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Parts I to V section scores radar chart"
            className="h-full w-full"
          >
            <defs>
              <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.22} />
              </radialGradient>
            </defs>

            {gridLevels.map((level) => (
              <polygon
                key={level}
                points={polygonPath(center, maxRadius, total, level)}
                fill="none"
                stroke="var(--chart-track)"
                strokeWidth={level === 1 ? 1.25 : 1}
                strokeDasharray={level === 1 ? undefined : '4 4'}
                opacity={level === 1 ? 1 : 0.85}
              />
            ))}

            <line
              x1={center}
              y1={center - maxRadius}
              x2={center}
              y2={center - maxRadius + 10}
              stroke="var(--muted)"
              strokeWidth={1}
              opacity={0.5}
            />
            <text x={center + 14} y={center - maxRadius + 4} fill="var(--muted)" fontSize={10} fontWeight={500}>
              100%
            </text>
            <text x={center + 14} y={center - maxRadius * 0.5 + 4} fill="var(--muted)" fontSize={10} fontWeight={500}>
              50%
            </text>

            {sections.map((section, index) => {
              const outer = polarPoint(center, maxRadius, index, total)
              const value = polarPoint(center, (section.percent / 100) * maxRadius, index, total)
              const labelPoint = polarPoint(center, labelRadius, index, total)
              const offset = axisLabelOffset(index, total)

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
                  <circle cx={value.x} cy={value.y} r={4} fill="var(--accent)" stroke="white" strokeWidth={2} />
                  <text
                    x={labelPoint.x + offset.dx}
                    y={labelPoint.y + offset.dy}
                    textAnchor={offset.anchor}
                    fill="var(--ink-soft)"
                    fontSize={12}
                    fontWeight={600}
                  >
                    Part {SECTION_ROMAN[section.id]}
                  </text>
                </g>
              )
            })}

            <polygon
              points={dataPath}
              fill="url(#radar-fill)"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            <circle cx={center} cy={center} r={54} fill="var(--card)" stroke="var(--line)" strokeWidth={1} />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Overall</p>
              <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-ink">
                {overallPercent}%
              </p>
              <p className="mt-0.5 text-sm tabular-nums text-muted">
                {overallAverage.toFixed(1)} / {max}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Each axis is one evaluation section. Outer edge = highest score. Detailed scores are listed
          at right.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line/60 bg-surface/30">
        <div className="border-b border-line/60 bg-surface/50 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-ink">Section breakdown</p>
          <p className="mt-0.5 text-xs text-muted">Parts I–V scores for this training</p>
        </div>

        <ul className="divide-y divide-line/50">
          {sections.map((section) => (
            <li key={section.id} className="px-4 py-3.5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
                    {SECTION_ROMAN[section.id]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                      Part {SECTION_ROMAN[section.id]}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-ink">{shortSectionTitle(section.label)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink">{section.percent}%</p>
                  <p className="text-xs tabular-nums text-muted">
                    {section.average.toFixed(1)} / {max}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-chart-track">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${section.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
