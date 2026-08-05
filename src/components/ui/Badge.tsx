import type { ReactNode } from 'react'

type Tone = 'neutral' | 'good' | 'warn' | 'accent'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink-soft',
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  accent: 'bg-accent-soft text-accent-deep',
}

type BadgeProps = {
  children: ReactNode
  tone?: Tone
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide',
        toneClass[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
