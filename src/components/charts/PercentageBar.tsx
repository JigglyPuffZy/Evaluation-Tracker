type PercentageBarProps = {
  label: string
  percent: number
  detail?: string
  tone?: 'accent' | 'ink'
}

export function PercentageBar({
  label,
  percent,
  detail,
  tone = 'accent',
}: PercentageBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div>
      <div className="mb-1.5 flex items-start justify-between gap-3 text-sm">
        <span className="font-medium leading-snug text-ink">{label}</span>
        <span className="shrink-0 tabular-nums text-muted">
          {clamped}%{detail ? ` · ${detail}` : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line/60">
        <div
          className={[
            'h-full rounded-full transition-all duration-700 ease-out',
            tone === 'accent' ? 'bg-gradient-to-r from-accent-deep to-accent' : 'bg-ink-soft',
          ].join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
