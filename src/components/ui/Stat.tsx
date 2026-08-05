type StatProps = {
  label: string
  value: string
  delta: string
  tone?: 'neutral' | 'good'
  className?: string
}

export function Stat({ label, value, delta, tone = 'neutral', className = '' }: StatProps) {
  return (
    <div
      className={[
        'animate-rise card-surface accent-top-line rounded-2xl p-5',
        className,
      ].join(' ')}
    >
      <p className="type-label text-muted">{label}</p>
      <p className="type-title-lg mt-3 tabular-nums text-ink">{value}</p>
      <p className={['type-body mt-2', tone === 'good' ? 'text-good' : 'text-muted'].join(' ')}>
        {delta}
      </p>
    </div>
  )
}
