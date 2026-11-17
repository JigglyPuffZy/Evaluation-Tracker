import type { ReactNode } from 'react'

export type Tone = 'good' | 'accent' | 'warn' | 'muted'

/** Colour a 1–5 rating (or any value against its max). */
export function toneFor(value: number | null, max = 5): Tone {
  if (value == null) {
    return 'muted'
  }
  const ratio = value / max
  if (ratio >= 0.85) {
    return 'good'
  }
  if (ratio >= 0.7) {
    return 'accent'
  }
  return 'warn'
}

const TEXT_TONE: Record<Tone, string> = {
  good: 'text-good',
  accent: 'text-accent',
  warn: 'text-warn',
  muted: 'text-muted',
}

const BAR_TONE: Record<Tone, string> = {
  good: 'bg-good',
  accent: 'bg-accent',
  warn: 'bg-warn',
  muted: 'bg-line',
}

const SOFT_TONE: Record<Tone, string> = {
  good: 'bg-good-soft text-good',
  accent: 'bg-accent-soft text-accent-deep',
  warn: 'bg-warn-soft text-warn',
  muted: 'bg-surface text-muted',
}

export const toneText = (tone: Tone) => TEXT_TONE[tone]
export const toneSoft = (tone: Tone) => SOFT_TONE[tone]

export function MeterBar({
  ratio,
  tone = 'accent',
  className = '',
}: {
  ratio: number | null
  tone?: Tone
  className?: string
}) {
  const percent = ratio == null ? 0 : Math.max(0, Math.min(1, ratio)) * 100
  return (
    <div className={['h-2 w-full overflow-hidden rounded-full bg-line/60', className].join(' ')}>
      <div
        className={['h-full rounded-full transition-all duration-700 ease-out', BAR_TONE[tone]].join(' ')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function formatScore(value: number | null, digits = 2): string {
  return value == null ? '—' : value.toFixed(digits)
}

export function formatDate(value: string): string {
  if (!value) {
    return ''
  }
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function StatusPill({ live }: { live: boolean }) {
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold',
        live ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
      ].join(' ')}
    >
      <span
        className={['h-1.5 w-1.5 rounded-full', live ? 'bg-good' : 'bg-warn'].join(' ')}
        aria-hidden="true"
      />
      {live ? 'Live' : 'Paused'}
    </span>
  )
}

export function KpiCard({
  label,
  value,
  unit,
  caption,
  ratio,
  tone = 'accent',
  icon,
}: {
  label: string
  value: string
  unit?: string
  caption?: string
  ratio?: number | null
  tone?: Tone
  icon: ReactNode
}) {
  return (
    <div className="card-surface flex min-w-0 flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span
          className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', SOFT_TONE[tone]].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums leading-none tracking-tight text-ink">{value}</span>
        {unit ? <span className="text-sm font-medium text-muted">{unit}</span> : null}
      </p>
      {ratio !== undefined ? <MeterBar ratio={ratio} tone={tone} /> : null}
      {caption ? <p className="text-xs leading-snug text-muted">{caption}</p> : null}
    </div>
  )
}

const iconProps = {
  className: 'h-[18px] w-[18px]',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const Icons = {
  users: (
    <svg {...iconProps}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.65a3.5 3.5 0 0 1 0 6.7" />
    </svg>
  ),
  star: (
    <svg {...iconProps}>
      <path d="m12 3.5 2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
    </svg>
  ),
  smile: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c.9 1.2 2 1.8 3.5 1.8s2.6-.6 3.5-1.8" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  ),
  thumb: (
    <svg {...iconProps}>
      <path d="M7 11v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1H7Zm0 0 3.5-6.5a1.7 1.7 0 0 1 3.2.9V9h4.6a1.8 1.8 0 0 1 1.75 2.2l-1.5 6.6A2 2 0 0 1 16.6 19.5H7" />
    </svg>
  ),
}
