import { Link, NavLink } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/programs', label: 'Trainings' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-accent-deep/30 bg-accent shadow-[0_4px_24px_rgba(0,40,85,0.22)] dark:border-line/20 dark:bg-[#0d1f3d] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link to="/" className="min-w-0 max-w-[42vw] shrink sm:max-w-none">
          <p className="truncate text-sm font-semibold tracking-tight sm:text-lg">
            Training Evaluation Analytics
          </p>
        </Link>

        <nav
          className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-sm"
          aria-label="Main"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
                  isActive
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-white/85 hover:bg-white/15 hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle variant="navbar" />
          <Link
            to="/login"
            className="hidden text-sm font-medium text-white/85 transition hover:text-white sm:inline-flex"
          >
            Sign out
          </Link>
        </div>
      </div>
    </header>
  )
}
