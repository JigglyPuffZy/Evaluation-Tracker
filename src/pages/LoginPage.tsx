import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    title: 'Program insights',
    description: 'Dashboards with scores, trends, and session breakdowns.',
  },
  {
    title: 'CSV import',
    description: 'Bring evaluation sheets in and see results instantly.',
  },
  {
    title: 'Role-ready',
    description: 'Built for trainers across DOST RO2 programs.',
  },
] as const

function MailIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6A2.5 2.5 0 0 0 12 15.5M6.7 6.9C8.4 5.7 10.1 5 12 5c4.2 0 7.8 2.3 9.5 6a10.4 10.4 0 0 1-2.3 3.4M9.9 9.9A4 4 0 0 1 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [shakeForm, setShakeForm] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      setShakeForm(true)
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))

    login(email, remember)
    navigate('/', { replace: true })
  }

  return (
    <div className="login-page login-atmosphere relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <div className="login-orb login-orb-a" aria-hidden="true" />
      <div className="login-orb login-orb-b" aria-hidden="true" />
      <div className="login-orb login-orb-c" aria-hidden="true" />
      <div className="login-spark login-spark-a" aria-hidden="true" />
      <div className="login-spark login-spark-b" aria-hidden="true" />
      <div className="absolute inset-0 login-grid opacity-100" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle variant="login" />
      </div>

      <div className="login-card relative z-10 grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.08fr_0.92fr]">
        <section className="login-brand-panel animate-rise relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <div className="login-brand-glow" aria-hidden="true" />

          <div className="relative">
            <div className="login-brand-badge">
              <span className="login-brand-dot" />
              DOST Regional Office No. 02
            </div>

            <h1 className="login-brand-title type-title-lg mt-8 max-w-md text-white">
              Training Evaluation
              <span className="login-brand-gradient block">Analytics Platform</span>
            </h1>

            <p className="type-body mt-4 max-w-sm text-white/78">
              Monitor program quality, trainer performance, and participant feedback in one
              polished workspace designed for regional training teams.
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={[
                  'login-feature-card',
                  index === 0 ? 'animate-rise-delay-1' : '',
                  index === 1 ? 'animate-rise-delay-2' : '',
                  index === 2 ? 'animate-rise-delay-3' : '',
                ].join(' ')}
              >
                <span className="login-feature-icon" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/68">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="login-form-panel animate-rise-delay-1 relative px-6 py-9 sm:px-10 sm:py-11">
          <div className="login-form-glow" aria-hidden="true" />

          <div className="relative">
            <div className="lg:hidden">
              <p className="login-form-kicker">DOST RO2</p>
              <h1 className="login-form-title type-title-md">Sign in</h1>
            </div>

            <div className="hidden lg:block">
              <h2 className="login-form-title type-title-lg">Welcome back</h2>
              <p className="login-form-subtitle mt-2 max-w-xs">
                Sign in to access dashboards, training records, and evaluation insights.
              </p>
            </div>

            <form
              className={`relative mt-8 space-y-5 ${shakeForm ? 'login-shake' : ''}`}
              onSubmit={handleSubmit}
              onAnimationEnd={() => setShakeForm(false)}
              noValidate
            >
              <label className="block">
                <span className="login-label">Work email</span>
                <span className="input-field-wrap">
                  <span className="login-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="login-input input-field-with-icon"
                    autoComplete="email"
                    placeholder="you@dost.gov.ph"
                  />
                </span>
              </label>

              <label className="block">
                <span className="login-label">Password</span>
                <span className="input-field-wrap">
                  <span className="login-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="login-input input-field-with-icon input-field-with-action"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="login-input-action"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="login-remember inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="login-checkbox"
                  />
                  Remember me
                </label>
                <button type="button" className="login-link">
                  Forgot password?
                </button>
              </div>

              {error ? <p className="login-error">{error}</p> : null}

              <button type="submit" className="login-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  'Sign in to dashboard'
                )}
              </button>
            </form>

            <p className="login-footer mt-7 flex items-center justify-center gap-2 text-center text-xs">
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3 4 7v5c0 4.4 3.4 8.5 8 10 4.6-1.5 8-5.6 8-10V7l-8-4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m9.5 12 1.8 1.8L15 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Secure regional workspace · Authorized personnel only
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
