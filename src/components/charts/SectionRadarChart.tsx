const SECTION_ROMAN: Record<string, string> = {
  part1: 'I',
  part2: 'II',
  part3: 'III',
  part4: 'IV',
  part5: 'V',
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

export function SectionRadarChart({ sections, max = 4 }: SectionRadarChartProps) {
  const size = 340
  const center = size / 2
  const maxRadius = 118
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
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="relative w-full">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Consolidated Parts I to V radar chart"
          className="overflow-visible"
        >
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={polygonPath(center, maxRadius, total, level)}
              fill="none"
              stroke="var(--chart-track)"
              strokeWidth={1}
            />
          ))}

          {sections.map((section, index) => {
            const outer = polarPoint(center, maxRadius, index, total)
            const value = polarPoint(center, (section.percent / 100) * maxRadius, index, total)
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
                <circle cx={value.x} cy={value.y} r={4.5} fill="var(--accent)" stroke="white" strokeWidth={1.5} />
                <text
                  x={polarPoint(center, maxRadius + 22, index, total).x}
                  y={polarPoint(center, maxRadius + 22, index, total).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--accent)"
                  fontSize={13}
                  fontWeight={700}
                >
                  {SECTION_ROMAN[section.id] ?? '·'}
                </text>
              </g>
            )
          })}

          <polygon
            points={dataPath}
            fill="var(--accent)"
            fillOpacity={0.18}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Parts I–V</p>
          <p className="text-3xl font-semibold tabular-nums text-ink">{overallPercent}%</p>
          <p className="text-sm tabular-nums text-muted">
            {overallAverage.toFixed(1)} / {max} avg
          </p>
        </div>
      </div>

      <p className="mt-2 text-center text-sm text-muted">
        Consolidated score across all five form sections
      </p>
    </div>
  )
}
