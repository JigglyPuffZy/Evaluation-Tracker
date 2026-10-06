import { useState } from 'react'

const features = [
  {
    title: 'Smart import & merge',
    body: 'Upload Google Form Excel files. Duplicates can be merged (update existing rows), skipped, or imported as new.',
  },
  {
    title: 'Merge training names',
    body: 'Combine spelling variants like “SSCP Workshop” and “SAMRT AND SUSTAINABLE…” into one program card.',
  },
  {
    title: 'Import history',
    body: 'Every upload is logged. Admins and staff can undo a batch if the wrong file was imported.',
  },
  {
    title: 'Search & filters',
    body: 'Find trainings quickly or filter by strong scores (≥ 3.5) or programs that need attention (< 3.0).',
  },
  {
    title: 'PDF-style reports',
    body: 'On any training page, download a PDF report with per-statement scores, sections, and Part VI comments.',
  },
  {
    title: 'Role-based access',
    body: 'Admins manage all data. Staff import and undo uploads. Viewers can browse dashboards read-only.',
  },
  {
    title: 'Password reset',
    body: 'Use “Forgot password?” on the login page to receive a reset link by email.',
  },
] as const

export function FeaturesHelpPanel() {
  const [open, setOpen] = useState(false)

  return (
    <section className="glass-panel rounded-2xl border border-line/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
        aria-expanded={open}
      >
        <div>
          <p className="type-kicker text-accent">Guide</p>
          <p className="type-title-sm mt-0.5 text-ink">What this app can do</p>
        </div>
        <span className="text-sm font-medium text-accent">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open ? (
        <div className="grid gap-3 border-t border-line/60 px-4 py-4 sm:grid-cols-2 sm:px-5">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl bg-surface/60 px-3 py-3">
              <h3 className="text-sm font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
