import { useMemo, useState } from 'react'
import type { PublicFeedbackForm } from '../../types/feedbackForm'
import {
  CSF_CC1_OPTIONS,
  CSF_CC2_OPTIONS,
  CSF_CC3_OPTIONS,
  CSF_CLIENT_CLASSIFICATIONS,
  CSF_SERVICE_GROUPS,
  CSF_SQD_SCALE,
  CSF_SQD_STATEMENTS,
  createEmptyCsfDraft,
  resolveCsfSection,
  type CsfSectionPartId,
  type CsfSubmissionDraft,
} from '../../types/csfForm'
import { submitPublicCsfForm } from '../../lib/feedbackFormDb'
import { BrandLogo } from '../ui/BrandLogo'

type PublicCsfWizardProps = {
  form: PublicFeedbackForm
}

type StepId = CsfSectionPartId | 'done'

const STEP_ORDER: CsfSectionPartId[] = ['part1', 'part2', 'part3', 'part4', 'part5']

function toggleListItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

export function PublicCsfWizard({ form }: PublicCsfWizardProps) {
  const [step, setStep] = useState<StepId>('part1')
  const [draft, setDraft] = useState<CsfSubmissionDraft>(() =>
    createEmptyCsfDraft(form.trainingDate),
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const stepIndex = step === 'done' ? STEP_ORDER.length : STEP_ORDER.indexOf(step as CsfSectionPartId)
  const progress = Math.round(((stepIndex + 1) / (STEP_ORDER.length + 1)) * 100)

  const section = useMemo(() => {
    if (step === 'done') {
      return null
    }
    return resolveCsfSection(step, form.sectionConfig)
  }, [step, form.sectionConfig])

  function patch(partial: Partial<CsfSubmissionDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
  }

  function validateStep(current: CsfSectionPartId): boolean {
    if (current === 'part1') {
      if (!draft.responseDate) {
        setError('Please enter the date of your visit or transaction.')
        return false
      }
      if (draft.clientType === '') {
        setError('Please select client type (Internal or External).')
        return false
      }
    }
    if (current === 'part2') {
      if (!draft.cc1) {
        setError('Please answer CC1 about Citizen’s Charter awareness.')
        return false
      }
      if (!draft.cc2) {
        setError('Please answer CC2 about CC visibility.')
        return false
      }
      if (!draft.cc3) {
        setError('Please answer CC3 about CC helpfulness.')
        return false
      }
    }
    if (current === 'part3') {
      if (!draft.officeUnit.trim()) {
        setError('Please enter the DOST RO2 office or unit.')
        return false
      }
      if (draft.servicesAvailed.length === 0) {
        setError('Please select at least one service availed.')
        return false
      }
    }
    if (current === 'part4') {
      const missing = CSF_SQD_STATEMENTS.some((item) => draft.sqd[item.id] == null)
      if (missing) {
        setError('Please rate every SQD statement (or choose N/A).')
        return false
      }
    }
    if (current === 'part5') {
      if (draft.recommendScore == null) {
        setError('Please select a recommendation score from 0 to 10.')
        return false
      }
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validateStep('part5')) {
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitPublicCsfForm(form.slug, draft)
      setStep('done')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit form.')
    } finally {
      setSubmitting(false)
    }
  }

  function goNext() {
    if (step === 'done') {
      return
    }
    if (!validateStep(step)) {
      return
    }
    const index = STEP_ORDER.indexOf(step)
    if (index < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[index + 1])
      return
    }
    void handleSubmit()
  }

  function goBack() {
    if (step === 'part1' || step === 'done') {
      return
    }
    const index = STEP_ORDER.indexOf(step as CsfSectionPartId)
    setStep(STEP_ORDER[index - 1])
    setError('')
  }

  if (step === 'done') {
    return (
      <div className="public-form-shell csf-form-shell">
        <div className="public-form-card csf-form-card public-form-success">
          <div className="public-form-success-icon" aria-hidden="true">
            ✓
          </div>
          <h1 className="csf-form-hero-title">Thank you!</h1>
          <p className="public-form-lead">
            Your customer satisfaction feedback has been received. This helps DOST RO2 serve you
            better.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-form-shell csf-form-shell">
      <header className="csf-form-banner">
        <div className="csf-form-banner-inner">
          <BrandLogo size="sm" withBackground className="h-10 w-10 shrink-0" />
          <div>
            <p className="csf-form-doc-id">QMS 06-F03 · Customer Satisfaction Feedback</p>
            <h1 className="csf-form-hero-title">Help us serve you better!</h1>
            <p className="csf-form-hero-sub">{form.trainingTitle}</p>
          </div>
        </div>
        {form.welcomeMessage ? <p className="csf-form-welcome">{form.welcomeMessage}</p> : null}
      </header>

      <div className="public-form-progress">
        <div className="public-form-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="public-form-card csf-form-card">
        {section ? (
          <>
            <h2 className="public-form-title">{section.title}</h2>
            <p className="public-form-muted">{section.description}</p>
          </>
        ) : null}

        {step === 'part1' ? (
          <div className="csf-form-section">
            <div className="public-form-grid">
              <label className="public-form-field">
                <span>Name (optional)</span>
                <input
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </label>
              <label className="public-form-field">
                <span>Age (optional)</span>
                <input
                  value={draft.age}
                  onChange={(event) => patch({ age: event.target.value })}
                />
              </label>
              <label className="public-form-field">
                <span>Sex</span>
                <select
                  value={draft.sex}
                  onChange={(event) =>
                    patch({ sex: event.target.value as CsfSubmissionDraft['sex'] })
                  }
                  className="h-11 rounded-xl border border-line bg-card px-3"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
              <label className="public-form-field">
                <span>Date</span>
                <input
                  type="date"
                  required
                  value={draft.responseDate}
                  onChange={(event) => patch({ responseDate: event.target.value })}
                />
              </label>
            </div>
            <label className="public-form-field public-form-field-block">
              <span>Address (optional)</span>
              <input
                value={draft.address}
                onChange={(event) => patch({ address: event.target.value })}
              />
            </label>
            <fieldset className="csf-check-group">
              <legend>Client classification (check all that apply)</legend>
              {CSF_CLIENT_CLASSIFICATIONS.map((item) => (
                <label key={item} className="csf-check-row">
                  <input
                    type="checkbox"
                    checked={draft.clientClassifications.includes(item)}
                    onChange={() =>
                      patch({
                        clientClassifications: toggleListItem(draft.clientClassifications, item),
                      })
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="csf-check-group">
              <legend>Client type</legend>
              <label className="csf-check-row">
                <input
                  type="radio"
                  name="clientType"
                  checked={draft.clientType === 'internal'}
                  onChange={() => patch({ clientType: 'internal' })}
                />
                <span>Internal</span>
              </label>
              <label className="csf-check-row">
                <input
                  type="radio"
                  name="clientType"
                  checked={draft.clientType === 'external'}
                  onChange={() => patch({ clientType: 'external' })}
                />
                <span>External</span>
              </label>
            </fieldset>
          </div>
        ) : null}

        {step === 'part2' ? (
          <div className="csf-form-section csf-cc-section">
            <QuestionBlock
              code="CC1"
              label="Which best describes your awareness of a Citizen’s Charter (CC)?"
              options={CSF_CC1_OPTIONS}
              value={draft.cc1}
              onChange={(value) => patch({ cc1: value })}
            />
            <QuestionBlock
              code="CC2"
              label="If aware of CC, how easy was it to find or see in this office?"
              options={CSF_CC2_OPTIONS}
              value={draft.cc2}
              onChange={(value) => patch({ cc2: value })}
            />
            <QuestionBlock
              code="CC3"
              label="How much did the Citizen’s Charter help you with your transaction?"
              options={CSF_CC3_OPTIONS}
              value={draft.cc3}
              onChange={(value) => patch({ cc3: value })}
            />
          </div>
        ) : null}

        {step === 'part3' ? (
          <div className="csf-form-section">
            <label className="public-form-field public-form-field-block">
              <span>DOST RO2 office / unit provider</span>
              <input
                value={draft.officeUnit}
                onChange={(event) => patch({ officeUnit: event.target.value })}
                placeholder="e.g. TSSD, PSTO Cagayan"
              />
            </label>
            <label className="public-form-field public-form-field-block">
              <span>Name of DOST RO2 employee (optional)</span>
              <input
                value={draft.employeeName}
                onChange={(event) => patch({ employeeName: event.target.value })}
              />
            </label>
            {CSF_SERVICE_GROUPS.map((group) => (
              <fieldset key={group.id} className="csf-check-group">
                <legend>{group.title}</legend>
                {group.services.map((service) => (
                  <label key={service} className="csf-check-row">
                    <input
                      type="checkbox"
                      checked={draft.servicesAvailed.includes(service)}
                      onChange={() =>
                        patch({
                          servicesAvailed: toggleListItem(draft.servicesAvailed, service),
                        })
                      }
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        ) : null}

        {step === 'part4' ? (
          <div className="csf-form-section">
            <div className="csf-sqd-header">Criteria · SQD0 – SQD8</div>
            {CSF_SQD_STATEMENTS.map((statement, index) => (
              <div key={statement.id} className="csf-sqd-row">
                <p className="csf-sqd-label">
                  <span className="csf-sqd-code">{statement.id.toUpperCase()}</span>
                  {statement.label}
                </p>
                <div className="csf-sqd-scale" role="radiogroup" aria-label={statement.label}>
                  {CSF_SQD_SCALE.map((scale) => (
                    <label
                      key={scale.value}
                      className={[
                        'csf-sqd-option',
                        draft.sqd[statement.id] === scale.value ? 'csf-sqd-option-selected' : '',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={statement.id}
                        className="sr-only"
                        checked={draft.sqd[statement.id] === scale.value}
                        onChange={() =>
                          patch({ sqd: { ...draft.sqd, [statement.id]: scale.value } })
                        }
                      />
                      <span className="csf-sqd-emoji" aria-hidden="true">
                        {scale.emoji}
                      </span>
                      <span className="csf-sqd-num">{scale.value}</span>
                    </label>
                  ))}
                  <label
                    className={[
                      'csf-sqd-option csf-sqd-na',
                      draft.sqd[statement.id] === 'na' ? 'csf-sqd-option-selected' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name={statement.id}
                      className="sr-only"
                      checked={draft.sqd[statement.id] === 'na'}
                      onChange={() => patch({ sqd: { ...draft.sqd, [statement.id]: 'na' } })}
                    />
                    N/A
                  </label>
                </div>
                {index === 0 ? (
                  <p className="csf-sqd-legend">
                    1 = Strongly Disagree · 5 = Strongly Agree · N/A = Not applicable
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {step === 'part5' ? (
          <div className="csf-form-section">
            <label className="public-form-field public-form-field-block">
              <span>Suggestions / comments (optional)</span>
              <textarea
                rows={4}
                value={draft.comments}
                onChange={(event) => patch({ comments: event.target.value })}
                placeholder="How can we improve our services?"
              />
            </label>
            <fieldset className="csf-nps">
              <legend>
                On a scale of 0–10, how likely are you to recommend DOST RO2 programs and services?
              </legend>
              <div className="csf-nps-grid">
                {Array.from({ length: 11 }, (_, score) => (
                  <label
                    key={score}
                    className={[
                      'csf-nps-cell',
                      draft.recommendScore === score ? 'csf-nps-cell-selected' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="nps"
                      className="sr-only"
                      checked={draft.recommendScore === score}
                      onChange={() => patch({ recommendScore: score })}
                    />
                    {String(score).padStart(2, '0')}
                  </label>
                ))}
              </div>
              <p className="csf-nps-hint">0 = Not at all likely · 10 = Extremely likely</p>
            </fieldset>
          </div>
        ) : null}

        {error ? (
          <p className="public-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="public-form-actions">
          <button type="button" className="public-form-btn public-form-btn-secondary" onClick={goBack}>
            Back
          </button>
          <button
            type="button"
            className="public-form-btn public-form-btn-primary"
            disabled={submitting}
            onClick={goNext}
          >
            {step === 'part5' ? (submitting ? 'Submitting…' : 'Submit feedback') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionBlock({
  code,
  label,
  options,
  value,
  onChange,
}: {
  code: string
  label: string
  options: readonly { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="csf-question-block">
      <legend>
        <span className="csf-question-code">{code}</span> {label}
      </legend>
      <div className="csf-option-list">
        {options.map((option) => (
          <label
            key={option.id}
            className={['csf-option-row', value === option.id ? 'csf-option-row-selected' : ''].join(
              ' ',
            )}
          >
            <input
              type="radio"
              name={code}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
