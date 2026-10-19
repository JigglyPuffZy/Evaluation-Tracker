import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicCsfWizard } from '../components/feedback/PublicCsfWizard'
import { PublicEvaluationWizard } from '../components/feedback/PublicEvaluationWizard'
import { fetchPublicFeedbackForm } from '../lib/feedbackFormDb'
import type { PublicFeedbackForm } from '../types/feedbackForm'
import '../public-feedback.css'

export function PublicFeedbackPage() {
  const { slug } = useParams<{ slug: string }>()
  const [form, setForm] = useState<PublicFeedbackForm | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setError('Invalid form link.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    void fetchPublicFeedbackForm(slug)
      .then((result) => {
        if (cancelled) {
          return
        }
        if (!result) {
          setError('This form is unavailable. It may have been unpublished or removed.')
          setForm(null)
          return
        }
        setForm(result)
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Could not load this evaluation form.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="public-form-shell">
        <div className="public-form-card">
          <p className="public-form-muted">Loading evaluation form…</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="public-form-shell">
        <div className="public-form-card">
          <h1 className="public-form-title">Form not found</h1>
          <p className="public-form-lead">{error || 'This link is not valid.'}</p>
          <Link to="/login" className="public-form-link">
            Staff login
          </Link>
        </div>
      </div>
    )
  }

  if (form.formType === 'csf') {
    return <PublicCsfWizard form={form} />
  }

  return <PublicEvaluationWizard form={form} />
}
