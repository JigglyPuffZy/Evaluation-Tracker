import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { useAuth } from '../context/AuthContext'
import { useEvaluationData } from '../context/EvaluationDataContext'
import {
  createFeedbackForm,
  fetchFeedbackForms,
  setFeedbackFormPublished,
  setFeedbackFormShowOnDashboard,
} from '../lib/feedbackFormDb'
import { buildPublicFormUrl } from '../lib/generateFormSlug'
import { canImportData } from '../lib/permissions'
import { CsfSectionEditor } from '../components/feedback/CsfSectionEditor'
import type { CreateFeedbackFormInput, FeedbackFormRecord } from '../types/feedbackForm'
import type { CsfSectionConfig, FeedbackFormType } from '../types/csfForm'

const defaultTrainingWelcome =
  'Thank you for attending this DOST RO2 training. Your honest feedback helps us improve future programs.'

const defaultCsfWelcome =
  'This survey measures your satisfaction with our service. Your personal information will be kept confidential and used only to improve DOST RO2 services.'

const FORM_TYPE_LABELS: Record<FeedbackFormType, string> = {
  csf: 'Customer Satisfaction (CSF)',
  training_evaluation: 'Training evaluation',
}

export function FeedbackFormsPage() {
  const { user } = useAuth()
  const { refreshFromDatabase } = useEvaluationData()
  const canManage = user ? canImportData(user.role) : false

  const [forms, setForms] = useState<FeedbackFormRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const [formType, setFormType] = useState<FeedbackFormType>('csf')
  const [trainingTitle, setTrainingTitle] = useState('')
  const [venue, setVenue] = useState('DOST RO2, Tuguegarao City')
  const [trainingDate, setTrainingDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [welcomeMessage, setWelcomeMessage] = useState(defaultCsfWelcome)
  const [sectionConfig, setSectionConfig] = useState<CsfSectionConfig>({})
  const [creating, setCreating] = useState(false)

  const loadForms = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchFeedbackForms()
      setForms(data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load forms. Run supabase/feedback-forms.sql in Supabase first.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadForms()
  }, [loadForms])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!canManage || !trainingTitle.trim()) {
      return
    }

    setCreating(true)
    setError('')
    try {
      const defaultWelcome =
        formType === 'csf' ? defaultCsfWelcome : defaultTrainingWelcome
      const input: CreateFeedbackFormInput = {
        formType,
        trainingTitle: trainingTitle.trim(),
        venue: venue.trim(),
        trainingDate,
        welcomeMessage: welcomeMessage.trim() || defaultWelcome,
        sectionConfig: formType === 'csf' ? sectionConfig : {},
      }
      const created = await createFeedbackForm(input, user?.id)
      setForms((current) => [created, ...current])
      setTrainingTitle('')
      setVenue('')
      setWelcomeMessage(formType === 'csf' ? defaultCsfWelcome : defaultTrainingWelcome)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create form.')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopyLink(slug: string) {
    const url = buildPublicFormUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(slug)
      window.setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  async function handleToggleDashboard(form: FeedbackFormRecord) {
    setError('')
    try {
      const next = !form.showOnDashboard
      await setFeedbackFormShowOnDashboard(form.id, next)
      setForms((current) =>
        current.map((item) => (item.id === form.id ? { ...item, showOnDashboard: next } : item)),
      )
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Could not update dashboard setting. Run feedback-forms-csf.sql in Supabase.',
      )
    }
  }

  async function handleTogglePublish(form: FeedbackFormRecord) {
    setError('')
    try {
      await setFeedbackFormPublished(form.id, !form.isPublished)
      setForms((current) =>
        current.map((item) =>
          item.id === form.id ? { ...item, isPublished: !form.isPublished } : item,
        ),
      )
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update form.')
    }
  }

  async function handleRefreshData() {
    await refreshFromDatabase()
    await loadForms()
  }

  if (!canManage) {
    return (
      <Section title="Online evaluation forms" description="You need staff access to create forms.">
        <Link to="/" className="text-sm font-medium text-accent hover:underline">
          Back to dashboard
        </Link>
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CSF · Online forms"
        title="Create evaluation links"
        description="Build a shareable CSF (QMS 06-F03 style) or training evaluation link. Participants answer on their phone; responses are stored in Supabase."
      />

      {error ? (
        <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
          {error}
        </p>
      ) : null}

      <Section
        title="New form"
        description="Choose CSF for frontline services (Parts 1–5 like the paper form) or training evaluation for workshop feedback."
      >
          <form onSubmit={handleCreate} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">Form template</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['csf', 'training_evaluation'] as const).map((type) => (
                  <label
                    key={type}
                    className={[
                      'flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-sm transition',
                      formType === type
                        ? 'border-accent bg-accent-soft/60 ring-2 ring-accent/15'
                        : 'border-line bg-card hover:border-accent/30',
                    ].join(' ')}
                  >
                    <span className="font-semibold text-ink">{FORM_TYPE_LABELS[type]}</span>
                    <span className="mt-0.5 text-xs text-muted">
                      {type === 'csf'
                        ? 'Client info, CC, services, SQD 1–5, NPS'
                        : 'Parts I–VI, 1–4 scale'}
                    </span>
                    <input
                      type="radio"
                      name="formType"
                      className="sr-only"
                      checked={formType === type}
                      onChange={() => {
                        setFormType(type)
                        setWelcomeMessage(
                          type === 'csf' ? defaultCsfWelcome : defaultTrainingWelcome,
                        )
                        if (type === 'csf' && !trainingTitle) {
                          setTrainingTitle('DOST RO2 — Customer Satisfaction Feedback')
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">
                {formType === 'csf' ? 'Form title / program name' : 'Training title'}
              </span>
              <input
                required
                value={trainingTitle}
                onChange={(event) => setTrainingTitle(event.target.value)}
                placeholder={
                  formType === 'csf'
                    ? 'e.g. DOST RO2 — Customer Satisfaction Feedback'
                    : 'e.g. RSTW 2026 — Smart Agriculture'
                }
                className="h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">Venue</span>
              <input
                value={venue}
                onChange={(event) => setVenue(event.target.value)}
                placeholder="e.g. DOST RO2 Training Hall"
                className="h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">
                {formType === 'csf' ? 'Default date on form' : 'Training date'}
              </span>
              <input
                required
                type="date"
                value={trainingDate}
                onChange={(event) => setTrainingDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink">Welcome message</span>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(event) => setWelcomeMessage(event.target.value)}
                className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            {formType === 'csf' ? (
              <CsfSectionEditor value={sectionConfig} onChange={setSectionConfig} />
            ) : null}
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Generate share link'}
            </Button>
          </form>
      </Section>

      <Section
        title="Mga ginawang form"
        description="Listahan ng lahat ng links. Sa CSF, makikita kung ilan na ang sumagot. Piliin kung ipapakita sa Dashboard (admin/staff/trainer)."
        action={
          <Button variant="secondary" size="sm" onClick={() => void handleRefreshData()}>
            Refresh
          </Button>
        }
      >
          {loading ? (
            <p className="text-sm text-muted">Loading forms…</p>
          ) : forms.length === 0 ? (
            <p className="text-sm text-muted">Wala pang form. Gumawa sa taas para makakuha ng link.</p>
          ) : (
            <ul className="space-y-3">
              {forms.map((form) => (
                <li key={form.id} className="rounded-xl border border-line/70 bg-surface/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-accent">
                        {FORM_TYPE_LABELS[form.formType]}
                      </p>
                      <p className="font-semibold text-ink">{form.trainingTitle}</p>
                      <p className="mt-1 text-xs text-muted">
                        {form.trainingDate}
                        {form.venue ? ` · ${form.venue}` : ''}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {form.formType === 'csf'
                          ? `${form.responseCount} CSF na sagot`
                          : `${form.responseCount} training response${form.responseCount === 1 ? '' : 's'}`}
                      </p>
                      {form.formType === 'csf' && form.showOnDashboard ? (
                        <p className="mt-1 text-xs font-medium text-good">Naka-display sa Dashboard</p>
                      ) : null}
                      <p className="mt-2 break-all font-mono text-xs text-accent-deep">
                        {buildPublicFormUrl(form.slug)}
                      </p>
                    </div>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        form.isPublished
                          ? 'bg-good-soft text-good'
                          : 'bg-warn-soft text-warn',
                      ].join(' ')}
                    >
                      {form.isPublished ? 'Live' : 'Paused'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void handleCopyLink(form.slug)}>
                      {copiedSlug === form.slug ? 'Copied!' : 'Copy link'}
                    </Button>
                    <a
                      href={buildPublicFormUrl(form.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center rounded-lg border border-line bg-card px-3 text-xs font-semibold text-ink transition hover:border-accent/40"
                    >
                      Preview form
                    </a>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleTogglePublish(form)}
                    >
                      {form.isPublished ? 'Pause link' : 'Publish link'}
                    </Button>
                    {form.formType === 'csf' ? (
                      <>
                        <Button
                          variant={form.showOnDashboard ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => void handleToggleDashboard(form)}
                        >
                          {form.showOnDashboard ? 'Alisin sa Dashboard' : 'Ipakita sa Dashboard'}
                        </Button>
                        <Link
                          to={`/csf/${form.id}`}
                          className="inline-flex h-9 items-center rounded-lg bg-accent-soft px-3 text-xs font-semibold text-accent-deep transition hover:bg-accent hover:text-white"
                        >
                          CSF summary
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/programs/${encodeURIComponent(form.trainingTitle)}`}
                        className="inline-flex h-9 items-center rounded-lg bg-accent-soft px-3 text-xs font-semibold text-accent-deep transition hover:bg-accent hover:text-white"
                      >
                        View analytics
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Section>
    </div>
  )
}
