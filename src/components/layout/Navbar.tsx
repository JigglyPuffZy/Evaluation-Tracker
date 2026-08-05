import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/programs', label: 'Trainings' },
]

export function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="glass-navbar sticky top-0 z-30 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link to="/" className="min-w-0 max-w-[42vw] shrink sm:max-w-none">
          <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Training Evaluation Analytics
          </p>
        </Link>

        <nav className="glass-nav-pill flex items-center gap-1 rounded-xl p-1" aria-label="Main">
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
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-white/85 transition hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
