import type { ReactNode } from 'react'
import { SectionHeading } from './PageHeader'

type Props = {
  id?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, title, description, action, children, className = '' }: Props) {
  return (
    <section
      id={id}
      className={[
        'animate-rise-delay-1 card-surface accent-top-line rounded-2xl p-5 md:p-6',
        className,
      ].join(' ')}
    >
      <SectionHeading title={title} description={description} action={action} />
      {children}
    </section>
  )
}
