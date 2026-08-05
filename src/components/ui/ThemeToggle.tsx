import { useTheme } from '../../context/ThemeContext'

function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 2.5v1.75M10 15.75V17.5M17.5 10h-1.75M4.25 10H2.5M15.1 4.9l-1.24 1.24M6.14 13.86l-1.24 1.24M15.1 15.1l-1.24-1.24M6.14 6.14 4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M15.8 12.2a6.5 6.5 0 0 1-8-8 6.75 6.75 0 1 0 8 8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ThemeToggleProps = {
  variant?: 'navbar' | 'default'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (variant === 'navbar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-medium text-ink-soft shadow-sm transition hover:border-accent/30 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      </span>
      <span className="hidden sm:inline">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
