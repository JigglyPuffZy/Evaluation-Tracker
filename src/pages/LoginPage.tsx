import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="login-center-feature-icon" aria-hidden="true">
      {children}
    </span>
  )
}

const features = [
  {
    label: 'Smart import',
    icon: (
      <FeatureIcon>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 16V4m0 0 4 4m-4-4-4 4M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </FeatureIcon>
    ),
  },
  {
    label: 'Live graphs',
    icon: (
      <FeatureIcon>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M4 18V6m0 12h16M8 18V12m4 6V9m4 9V14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </FeatureIcon>
    ),
  },
  {
    label: 'PDF reports',
    icon: (
      <FeatureIcon>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M8 4h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 4v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </FeatureIcon>
    ),
  },
  {
    label: 'Role-based access',
    icon: (
      <FeatureIcon>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 3 4 7v5c0 4.4 3.4 8.5 8 10 4.6-1.5 8-5.6 8-10V7l-8-4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </FeatureIcon>
    ),
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
    <div className="login-center">
      <div className="login-center-bg" aria-hidden="true">
        <div className="login-center-beam" />
        <div className="login-center-orb login-center-orb-a" />
        <div className="login-center-orb login-center-orb-b" />
        <div className="login-center-grid" />
      </div>

      <main className="login-center-main">
        <div className={`login-center-card animate-rise ${shakeForm ? 'login-shake' : ''}`}>
          <header className="login-center-head">
            <div className="login-center-logo-wrap">
              <div className="login-center-logo-ring" />
              <div className="login-center-logo">
                <BrandLogo size="lg" withBackground={false} />
              </div>
            </div>
            <span className="login-center-badge">DOST Regional Office No. II</span>
            <h1 className="login-center-title">
              Evaluation <span className="login-center-title-accent">Tracker</span>
            </h1>
            <p className="login-center-lead">Training Evaluation Analytics</p>
          </header>

          <ul className="login-center-features" aria-label="App highlights">
            {features.map((feature) => (
              <li key={feature.label}>
                {feature.icon}
                <span>{feature.label}</span>
              </li>
            ))}
          </ul>

          <form
            className="login-center-form"
            onSubmit={handleSubmit}
            onAnimationEnd={() => setShakeForm(false)}
            noValidate
          >
            <label className="login-center-field">
              <span className="login-center-label">Email</span>
              <span className="login-center-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" className="login-center-input-icon" aria-hidden="true">
                  <path
                    d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-center-input login-center-input-with-icon"
                  autoComplete="email"
                  placeholder="you@dost.gov.ph"
                />
              </span>
            </label>

            <label className="login-center-field">
              <span className="login-center-label">Password</span>
              <span className="login-center-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" className="login-center-input-icon" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M8 11V8a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-center-input login-center-input-with-icon login-center-input-password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="login-center-eye"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </span>
            </label>

            <div className="login-center-meta">
              <label className="login-center-remember">
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
                className="login-center-link"
                onClick={() => void handleForgotPassword()}
                disabled={isResetting}
              >
                {isResetting ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>

            {resetMessage ? <p className="login-center-success">{resetMessage}</p> : null}
            {error ? <p className="login-center-error">{error}</p> : null}

            <button type="submit" className="login-center-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                <>
                  Enter dashboard
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

          <p className="login-center-footnote">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path
                d="M12 3 4 7v5c0 4.4 3.4 8.5 8 10 4.6-1.5 8-5.6 8-10V7l-8-4Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Authorized DOST RO2 personnel only
          </p>
        </div>
      </main>
    </div>
  )
}
