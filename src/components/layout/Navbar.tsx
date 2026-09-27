import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleLabel } from '../../lib/permissions'
import { BrandLogo } from '../ui/BrandLogo'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/programs', label: 'Trainings', end: false, icon: TrainingsIcon },
] as const

function DashboardIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TrainingsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="15.5" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 17H4.5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4.5 3H7.5M12.5 13.5 16 10l-3.5-3.5M16 10H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function Navbar() {
  const navigate = useNavigate()
  const { logout, user, isReadOnly } = useAuth()

  function handleSignOut() {
    void logout().then(() => {
      navigate('/login', { replace: true })
    })
  }

  return (
    <header className="glass-navbar sticky top-0 z-30 text-white">
      <div className="navbar-shine" aria-hidden="true" />
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 md:px-6 lg:gap-6">
        <Link to="/" className="navbar-brand group flex min-w-0 shrink items-center gap-3">
          <span className="navbar-logo-wrap">
            <BrandLogo size="md" withBackground={false} className="h-9 w-9" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight sm:text-[0.95rem]">
              DOST RO2
            </span>
            <span className="navbar-brand-subtitle hidden truncate sm:block">
              Training Evaluation Analytics
            </span>
          </span>
        </Link>

        <nav className="glass-nav-pill flex items-center gap-0.5 rounded-2xl p-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                ['navbar-nav-link', isActive ? 'navbar-nav-link-active' : ''].filter(Boolean).join(' ')
              }
            >
              <item.icon />
              <span className="hidden min-[480px]:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="navbar-user-zone flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <div className="navbar-user-pill hidden items-center gap-2.5 sm:flex">
              <span className="navbar-avatar" aria-hidden="true">
                {userInitials(user.displayName)}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block max-w-[7.5rem] truncate text-sm font-medium text-white">
                  {user.displayName}
                </span>
                <span
                  className={[
                    'navbar-role-badge',
                    isReadOnly ? 'navbar-role-badge-staff' : 'navbar-role-badge-admin',
                  ].join(' ')}
                >
                  {roleLabel(user.role)}
                </span>
              </span>
            </div>
          ) : null}
          <button type="button" onClick={handleSignOut} className="navbar-signout">
            <SignOutIcon />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
