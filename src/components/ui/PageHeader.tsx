import type { ReactNode } from 'react'

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
            <p className="type-kicker text-accent">{eyebrow}</p>
            <h1 className="type-title-lg mt-2 text-ink sm:text-[1.75rem] md:text-3xl">
              {title}
            </h1>
            <p className="type-body mt-2.5 max-w-2xl text-muted sm:text-[0.9375rem]">
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
          <h2 className="type-title-sm text-ink sm:text-lg">{title}</h2>
          {description ? (
            <p className="type-body mt-1.5 text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
