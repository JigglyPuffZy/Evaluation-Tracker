import type { ReactNode } from 'react'
import { Button } from './Button'

type PageHeaderProps = {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow = 'DOST RO2',
  action,
}: PageHeaderProps) {
  return (
    <header className="page-header animate-rise mb-6 rounded-2xl sm:mb-8">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 md:p-7">
        <div className="flex min-w-0 gap-4">
          <div className="heading-accent hidden shrink-0 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem] md:text-3xl">
              {title}
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
      </div>
    </header>
  )
}

type SectionHeadingProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-5 flex gap-3 sm:gap-4">
      <div className="heading-accent shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/70 px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
