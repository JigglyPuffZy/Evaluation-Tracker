import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M12.5 15.5 7 10l5.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M4 16V8M10 16V4M16 16v-6" strokeLinecap="round" />
    </svg>
  )
}

type BackLinkProps = {
  to?: string
  children?: ReactNode
}

export function BackLink({ to = '/', children = 'Back to dashboard' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-medium text-ink-soft shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-x-0.5 hover:border-accent/35 hover:text-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
        <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-px" />
      </span>
      {children}
    </Link>
  )
}

type ViewGraphsLinkProps = Omit<LinkProps, 'children'> & {
  children?: ReactNode
  compact?: boolean
}

export function ViewGraphsLink({
  children = 'View graphs',
  compact = false,
  className = '',
  ...props
}: ViewGraphsLinkProps) {
  return (
    <Link
      {...props}
      className={[
        'group inline-flex items-center justify-center gap-2 rounded-lg font-medium text-accent-deep transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        compact
          ? 'h-9 px-3 text-sm text-muted hover:bg-accent-soft hover:text-accent-deep'
          : 'bg-accent-soft px-4 py-2 text-sm shadow-sm hover:bg-accent hover:text-white hover:shadow-[0_4px_14px_rgba(0,87,184,0.28)]',
        className,
      ].join(' ')}
    >
      {!compact ? <ChartIcon className="h-4 w-4 opacity-80 transition group-hover:opacity-100" /> : null}
      {children}
      <ArrowRightIcon
        className={[
          'h-4 w-4 transition-transform',
          compact ? 'opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100' : 'group-hover:translate-x-0.5',
        ].join(' ')}
      />
    </Link>
  )
}
