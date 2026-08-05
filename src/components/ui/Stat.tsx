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
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className={['mt-2 text-sm', tone === 'good' ? 'text-good' : 'text-muted'].join(' ')}>
        {delta}
      </p>
    </div>
  )
}
