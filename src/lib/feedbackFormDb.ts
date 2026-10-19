import { computeCsfFormStats } from './computeCsfFormStats'
import type {
  CreateFeedbackFormInput,
  DashboardCsfFormSummary,
  FeedbackFormRecord,
  PublicFeedbackForm,
} from '../types/feedbackForm'
import type { CsfSectionConfig, CsfSubmissionDraft, FeedbackFormType } from '../types/csfForm'
import { RATING_FIELD_KEYS, type EvaluationRow, type RatingFieldKey } from '../types/evaluation'
import { generateFormSlug } from './generateFormSlug'
import { supabase } from './supabase'

type DbFeedbackForm = {
  id: string
  slug: string
  form_type?: string
  training_title: string
  venue: string
  training_date: string
  welcome_message: string
  section_config?: CsfSectionConfig | null
  is_published: boolean
  show_on_dashboard?: boolean
  created_at: string
}

function parseFormType(value: string | undefined): FeedbackFormType {
  return value === 'csf' ? 'csf' : 'training_evaluation'
}

function mapForm(row: DbFeedbackForm, responseCount = 0): FeedbackFormRecord {
  return {
    id: row.id,
    slug: row.slug,
    formType: parseFormType(row.form_type),
    trainingTitle: row.training_title,
    venue: row.venue,
    trainingDate: row.training_date,
    welcomeMessage: row.welcome_message,
    sectionConfig: row.section_config ?? {},
    isPublished: row.is_published,
    showOnDashboard: row.show_on_dashboard ?? false,
    createdAt: row.created_at,
    responseCount,
  }
}

async function countResponses(form: DbFeedbackForm): Promise<number> {
  const table = parseFormType(form.form_type) === 'csf' ? 'csf_responses' : 'evaluations'
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('feedback_form_id', form.id)

  if (error) {
    return 0
  }
  return count ?? 0
}

export async function fetchFeedbackForms(): Promise<FeedbackFormRecord[]> {
  const { data, error } = await supabase
    .from('feedback_forms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const forms = (data as DbFeedbackForm[]) ?? []
  const counts = await Promise.all(forms.map((form) => countResponses(form)))
  return forms.map((form, index) => mapForm(form, counts[index]))
}

export async function createFeedbackForm(
  input: CreateFeedbackFormInput,
  userId: string | undefined,
): Promise<FeedbackFormRecord> {
  const slug = generateFormSlug(input.trainingTitle)

  const { data, error } = await supabase
    .from('feedback_forms')
    .insert({
      slug,
      form_type: input.formType,
      training_title: input.trainingTitle.trim(),
      venue: input.venue.trim(),
      training_date: input.trainingDate,
      welcome_message: input.welcomeMessage.trim(),
      section_config: input.sectionConfig,
      created_by: userId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapForm(data as DbFeedbackForm, 0)
}

export async function setFeedbackFormPublished(
  formId: string,
  isPublished: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('feedback_forms')
    .update({ is_published: isPublished })
    .eq('id', formId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setFeedbackFormShowOnDashboard(
  formId: string,
  showOnDashboard: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('feedback_forms')
    .update({ show_on_dashboard: showOnDashboard })
    .eq('id', formId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchCsfResponsesRaw(formId: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('csf_responses')
    .select('response')
    .eq('feedback_form_id', formId)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => (row as { response: unknown }).response)
}

export async function fetchDashboardCsfSummaries(): Promise<DashboardCsfFormSummary[]> {
  const { data, error } = await supabase
    .from('feedback_forms')
    .select('*')
    .eq('form_type', 'csf')
    .eq('show_on_dashboard', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const forms = (data as DbFeedbackForm[]) ?? []
  const summaries = await Promise.all(
    forms.map(async (form) => {
      const responses = await fetchCsfResponsesRaw(form.id)
      const stats = computeCsfFormStats(responses)
      const responseCount = stats.responseCount
      return { ...mapForm(form, responseCount), stats }
    }),
  )

  return summaries
}

export async function fetchPublicFeedbackForm(slug: string): Promise<PublicFeedbackForm | null> {
  const { data, error } = await supabase.rpc('get_public_feedback_form', {
    form_slug: slug,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  return {
    id: String(record.id),
    slug: String(record.slug),
    formType: parseFormType(String(record.form_type ?? 'training_evaluation')),
    trainingTitle: String(record.training_title),
    venue: String(record.venue ?? ''),
    trainingDate: String(record.training_date),
    welcomeMessage: String(record.welcome_message ?? ''),
    sectionConfig: (record.section_config as CsfSectionConfig) ?? {},
  }
}

export function buildSubmissionPayload(row: EvaluationRow): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    evaluator_name: row.evaluator_name,
    contact_number: row.contact_number,
    venue: row.venue,
    training_date: row.training_date,
    areas_for_improvement: row.areas_for_improvement,
    future_suggestions: row.future_suggestions,
  }

  for (const key of RATING_FIELD_KEYS) {
    payload[key] = row[key]
  }

  return payload
}

export async function submitPublicFeedbackForm(
  slug: string,
  row: EvaluationRow,
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_public_feedback', {
    form_slug: slug,
    payload: buildSubmissionPayload(row),
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = data as { id?: string } | null
  return result?.id ?? ''
}

export async function submitPublicCsfForm(
  slug: string,
  draft: CsfSubmissionDraft,
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_public_csf', {
    form_slug: slug,
    payload: draft,
  })

  if (error) {
    throw new Error(error.message)
  }

  const result = data as { id?: string } | null
  return result?.id ?? ''
}

export function createEmptyEvaluationDraft(form: PublicFeedbackForm): EvaluationRow {
  const ratings = Object.fromEntries(RATING_FIELD_KEYS.map((key) => [key, 0])) as Record<
    RatingFieldKey,
    number
  >

  return {
    id: '',
    evaluator_name: '',
    contact_number: '',
    training_title: form.trainingTitle,
    venue: form.venue,
    training_date: form.trainingDate,
    areas_for_improvement: '',
    future_suggestions: '',
    ...ratings,
  }
}
