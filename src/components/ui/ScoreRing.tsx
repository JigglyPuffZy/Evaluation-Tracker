type ScoreRingProps = {
  average: number
  percent: number
  max?: number
  size?: number
}

export function ScoreRing({ average, percent, max = 4, size = 120 }: ScoreRingProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, percent))
  const dash = (progress / 100) * circumference

  return (
    <div
      className="relative flex shrink-0 flex-col items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Overall score ${average} out of ${max}, ${percent} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          opacity={0.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-ink">
          {average.toFixed(1)}
        </span>
        <span className="text-xs font-medium text-muted">of {max}.0</span>
        <span className="mt-0.5 text-xs font-semibold text-good">{percent}%</span>
      </div>
    </div>
  )
}
