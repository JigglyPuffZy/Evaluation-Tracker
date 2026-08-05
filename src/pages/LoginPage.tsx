import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@dost.gov.ph')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Auth will be wired to Supabase in a later step. UI shell navigates into the app.
    navigate('/')
  }

  return (
    <div className="login-atmosphere relative flex min-h-svh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 panel-grid opacity-20" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-rise hidden flex-col justify-between p-10 text-white lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
              DOST Regional Office No. 02
            </p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Training Evaluation Analytics
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Track program quality, session feedback, and trainer performance in one clear
              workspace.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-soft" />
              Role-based views for Admin and Trainer
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-soft" />
              Import evaluations and view graphs with percentages
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-soft" />
              Export-ready evaluation records
            </li>
          </ul>
        </section>

        <section className="animate-rise-delay-1 bg-card px-6 py-10 sm:px-10">
          <div className="lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              DOST RO2
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">Sign in</h1>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-3xl font-semibold text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-muted">Sign in to open your evaluation workspace.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                autoComplete="current-password"
                placeholder="Enter password"
              />
            </label>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            UI shell only — Supabase Auth will be connected in the next step.
          </p>
        </section>
      </div>
    </div>
  )
}
