import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginShowcase } from '../components/auth/LoginShowcase'
import { BrandLogo } from '../components/ui/BrandLogo'
import { useAuth } from '../context/AuthContext'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.5 12.5C4.2 8.8 7.8 6.5 12 6.5s7.8 2.3 9.5 6c-1.7 3.2-5.3 5.5-9.5 5.5S4.2 15.7 2.5 12.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A2.5 2.5 0 0 0 12 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="h-[1.125rem] w-[1.125rem]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-[1.125rem] w-[1.125rem]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const features = [
  {
    title: 'Import in seconds',
    desc: 'Drop Google Form Excel files and map columns automatically.',
  },
  {
    title: 'Radar breakdown',
    desc: 'Visualize Parts I–V with session-level drill-down.',
  },
  {
    title: 'One regional hub',
    desc: 'Every DOST RO2 training evaluation in a single workspace.',
  },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const { login, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [shakeForm, setShakeForm] = useState(false)

  async function handleForgotPassword() {
    setError('')
    setResetMessage('')

    if (!email.trim()) {
      setError('Enter your email above, then click Forgot password.')
      setShakeForm(true)
      return
    }

    setIsResetting(true)
    try {
      await resetPassword(email.trim())
      setResetMessage('Password reset link sent. Check your inbox (and spam folder).')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send reset email.')
      setShakeForm(true)
    } finally {
      setIsResetting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      setShakeForm(true)
      return
    }

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed.')
      setShakeForm(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-gate">
      <aside className="login-gate-showcase" aria-hidden="true">
        <div className="login-gate-showcase-bg">
          <div className="login-gate-orb login-gate-orb-a" />
          <div className="login-gate-orb login-gate-orb-b" />
          <div className="login-gate-grid" />
        </div>

        <div className="login-gate-showcase-inner animate-rise">
          <div className="login-gate-showcase-brand">
            <BrandLogo size="md" withBackground={false} className="login-gate-logo" />
            <span>DOST RO2</span>
          </div>

          <h2 className="login-gate-showcase-title">
            Training evaluations,
            <span className="block">visualized beautifully.</span>
          </h2>

          <p className="login-gate-showcase-lead">
            From spreadsheet rows to radar charts — built for regional evaluators who need clarity, not clutter.
          </p>

          <LoginShowcase />

          <ul className="login-gate-features">
            {features.map((f) => (
              <li key={f.title}>
                <span className="login-gate-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                    <path
                      d="M5 10.5 8.5 14 15 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="login-gate-main">
        <div className="login-gate-main-inner">
          <header className="login-gate-mobile-brand lg:hidden">
            <BrandLogo size="md" />
            <div>
              <p className="login-gate-mobile-title">Evaluation Tracker</p>
              <p className="login-gate-mobile-sub">DOST RO2 · Sign in to continue</p>
            </div>
          </header>

          <div className={`login-gate-card animate-rise ${shakeForm ? 'login-shake' : ''}`}>
            <header className="login-gate-card-head">
              <div className="hidden lg:block">
                <BrandLogo size="lg" />
              </div>
              <div>
                <p className="type-kicker text-accent">Secure sign in</p>
                <h1 className="login-gate-heading">Welcome back</h1>
                <p className="login-gate-subheading">
                  Enter your credentials to open the evaluation dashboard.
                </p>
              </div>
            </header>

            <form
              className="login-gate-form"
              onSubmit={handleSubmit}
              onAnimationEnd={() => setShakeForm(false)}
              noValidate
            >
              <label className="login-gate-field">
                <span className="login-gate-label">Email address</span>
                <span className="login-gate-input-wrap">
                  <span className="login-gate-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-gate-input"
                    autoComplete="email"
                    placeholder="you@dost.gov.ph"
                  />
                </span>
              </label>

              <label className="login-gate-field">
                <span className="login-gate-label">Password</span>
                <span className="login-gate-input-wrap">
                  <span className="login-gate-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-gate-input login-gate-input-password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="login-gate-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </span>
              </label>

              <div className="login-gate-meta">
                <label className="login-gate-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="login-checkbox"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="login-link text-sm"
                  onClick={() => void handleForgotPassword()}
                  disabled={isResetting}
                >
                  {isResetting ? 'Sending link…' : 'Forgot password?'}
                </button>
              </div>

              {resetMessage ? (
                <p className="rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-sm text-good">
                  {resetMessage}
                </p>
              ) : null}

              {error ? <p className="login-error">{error}</p> : null}

              <button type="submit" className="login-gate-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  <>
                    Continue to dashboard
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path
                        d="M7.5 4.5 13 10l-5.5 5.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="login-gate-footnote">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-good" aria-hidden="true">
                <path d="M12 3 4 7v5c0 4.4 3.4 8.5 8 10 4.6-1.5 8-5.6 8-10V7l-8-4Z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Authorized DOST RO2 personnel only
            </p>
          </div>

          <ul className="login-gate-mobile-features lg:hidden">
            {features.map((f) => (
              <li key={f.title}>{f.title}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
