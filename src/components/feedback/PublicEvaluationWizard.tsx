import { useMemo, useState } from 'react'
import type { PublicFeedbackForm } from '../../types/feedbackForm'
import {
  EVALUATION_SECTIONS,
  PART_VI_SECTION,
  RATING_FIELD_KEYS,
  RATING_FIELD_LABELS,
  type EvaluationRow,
  type RatingFieldKey,
} from '../../types/evaluation'
import { createEmptyEvaluationDraft, submitPublicFeedbackForm } from '../../lib/feedbackFormDb'
import { RatingScaleInput } from './RatingScaleInput'
import { BrandLogo } from '../ui/BrandLogo'

type PublicEvaluationWizardProps = {
  form: PublicFeedbackForm
}

type Step =
  | { kind: 'intro' }
  | { kind: 'section'; sectionIndex: number }
  | { kind: 'comments' }
  | { kind: 'done' }

function missingRatingKeys(draft: EvaluationRow): RatingFieldKey[] {
  return RATING_FIELD_KEYS.filter((key) => draft[key] < 1 || draft[key] > 4)
}

export function PublicEvaluationWizard({ form }: PublicEvaluationWizardProps) {
  const [step, setStep] = useState<Step>({ kind: 'intro' })
  const [draft, setDraft] = useState<EvaluationRow>(() => createEmptyEvaluationDraft(form))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalSteps = EVALUATION_SECTIONS.length + 2
  const currentStepNumber = useMemo(() => {
    if (step.kind === 'intro') {
      return 1
    }
    if (step.kind === 'section') {
      return step.sectionIndex + 2
    }
    if (step.kind === 'comments') {
      return EVALUATION_SECTIONS.length + 2
    }
    return totalSteps
  }, [step, totalSteps])

  const progress = Math.round((currentStepNumber / totalSteps) * 100)

  function updateField<K extends keyof EvaluationRow>(key: K, value: EvaluationRow[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateRating(key: RatingFieldKey, score: number) {
    setDraft((current) => ({ ...current, [key]: score }))
  }

  function validateSection(sectionIndex: number): boolean {
    const section = EVALUATION_SECTIONS[sectionIndex]
    const missing = section.fields.filter((key) => draft[key] < 1)
    if (missing.length > 0) {
      setError('Please answer every statement in this section before continuing.')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    const missing = missingRatingKeys(draft)
    if (missing.length > 0) {
      setError('Please complete all rating questions before submitting.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await submitPublicFeedbackForm(form.slug, draft)
      setStep({ kind: 'done' })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not submit your evaluation. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (step.kind === 'done') {
    return (
      <div className="public-form-shell">
        <div className="public-form-card public-form-success">
          <div className="public-form-success-icon" aria-hidden="true">
            ✓
          </div>
          <h1 className="public-form-title">Thank you!</h1>
          <p className="public-form-lead">
            Your feedback for <strong>{form.trainingTitle}</strong> was submitted successfully.
          </p>
          <p className="public-form-muted">You may close this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-form-shell">
      <header className="public-form-header">
        <BrandLogo size="sm" withBackground className="h-9 w-9" />
        <div>
          <p className="public-form-kicker">DOST RO2 · Training evaluation</p>
          <h1 className="public-form-header-title">{form.trainingTitle}</h1>
        </div>
      </header>

      <div className="public-form-progress" aria-hidden="true">
        <div className="public-form-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="public-form-step-label">
        Step {currentStepNumber} of {totalSteps}
      </p>

      <div className="public-form-card">
        {step.kind === 'intro' ? (
          <>
            <h2 className="public-form-title">Participant information</h2>
            {form.welcomeMessage ? (
              <p className="public-form-lead">{form.welcomeMessage}</p>
            ) : (
              <p className="public-form-lead">
                Help us improve our training programs. This form uses the official 1–4 evaluation
                scale.
              </p>
            )}
            <div className="public-form-grid">
              <label className="public-form-field">
                <span>Name (optional)</span>
                <input
                  type="text"
                  value={draft.evaluator_name}
                  onChange={(event) => updateField('evaluator_name', event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
              <label className="public-form-field">
                <span>Contact number (optional)</span>
                <input
                  type="tel"
                  value={draft.contact_number}
                  onChange={(event) => updateField('contact_number', event.target.value)}
                  placeholder="09xx xxx xxxx"
                  autoComplete="tel"
                />
              </label>
              <label className="public-form-field">
                <span>Venue</span>
                <input
                  type="text"
                  value={draft.venue}
                  onChange={(event) => updateField('venue', event.target.value)}
                  placeholder="Training venue"
                />
              </label>
              <label className="public-form-field">
                <span>Training date</span>
                <input
                  type="date"
                  value={draft.training_date}
                  onChange={(event) => updateField('training_date', event.target.value)}
                  required
                />
              </label>
            </div>
          </>
        ) : null}

        {step.kind === 'section' ? (
          <>
            <h2 className="public-form-title">{EVALUATION_SECTIONS[step.sectionIndex].title}</h2>
            <p className="public-form-muted">Tap the score that best matches your experience.</p>
            <div className="public-form-questions">
              {EVALUATION_SECTIONS[step.sectionIndex].fields.map((key) => (
                <RatingScaleInput
                  key={key}
                  name={key}
                  label={RATING_FIELD_LABELS[key]}
                  value={draft[key]}
                  onChange={(score) => updateRating(key, score)}
                />
              ))}
            </div>
          </>
        ) : null}

        {step.kind === 'comments' ? (
          <>
            <h2 className="public-form-title">{PART_VI_SECTION.title}</h2>
            {PART_VI_SECTION.fields.map((field) => (
              <label key={field.key} className="public-form-field public-form-field-block">
                <span>{field.label}</span>
                <textarea
                  rows={4}
                  value={draft[field.key as keyof EvaluationRow] as string}
                  onChange={(event) =>
                    updateField(field.key as keyof EvaluationRow, event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>
            ))}
          </>
        ) : null}

        {error ? (
          <p className="public-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="public-form-actions">
          <button
            type="button"
            className="public-form-btn public-form-btn-secondary"
            disabled={step.kind === 'intro' || submitting}
            onClick={() => {
              if (step.kind === 'section' && step.sectionIndex > 0) {
                setStep({ kind: 'section', sectionIndex: step.sectionIndex - 1 })
                setError('')
                return
              }
              if (step.kind === 'section' && step.sectionIndex === 0) {
                setStep({ kind: 'intro' })
                setError('')
                return
              }
              if (step.kind === 'comments') {
                setStep({ kind: 'section', sectionIndex: EVALUATION_SECTIONS.length - 1 })
                setError('')
              }
            }}
          >
            Back
          </button>

          {step.kind === 'intro' ? (
            <button
              type="button"
              className="public-form-btn public-form-btn-primary"
              onClick={() => {
                if (!draft.training_date) {
                  setError('Please select the training date.')
                  return
                }
                setError('')
                setStep({ kind: 'section', sectionIndex: 0 })
              }}
            >
              Start evaluation
            </button>
          ) : null}

          {step.kind === 'section' ? (
            <button
              type="button"
              className="public-form-btn public-form-btn-primary"
              onClick={() => {
                if (!validateSection(step.sectionIndex)) {
                  return
                }
                if (step.sectionIndex < EVALUATION_SECTIONS.length - 1) {
                  setStep({ kind: 'section', sectionIndex: step.sectionIndex + 1 })
                  return
                }
                setStep({ kind: 'comments' })
              }}
            >
              Continue
            </button>
          ) : null}

          {step.kind === 'comments' ? (
            <button
              type="button"
              className="public-form-btn public-form-btn-primary"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Submitting…' : 'Submit evaluation'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
