type Slice = {
  label: string
  percent: number
  color: string
}

type DonutChartProps = {
  slices: Slice[]
  centerLabel: string
  centerValue: string
}

const COLORS = ['#0057b8', '#003d82', '#1a3a6b', '#5a6f8c', '#94a3b8']

export function DonutChart({ slices, centerLabel, centerValue }: DonutChartProps) {
  const size = 180
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = slices.map((slice, index) => {
    const length = (slice.percent / 100) * circumference
    const arc = {
      ...slice,
      color: slice.color || COLORS[index % COLORS.length],
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    }
    offset += length
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Rating distribution">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--chart-track)"
            strokeWidth={stroke}
          />
          {arcs.map((arc) =>
            arc.percent > 0 ? (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{centerLabel}</p>
          <p className="text-2xl font-semibold text-ink">{centerValue}</p>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: slice.color || COLORS[index % COLORS.length] }}
              />
              {slice.label}
            </span>
            <span className="tabular-nums font-medium text-ink">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
