import { RATING_FIELD_KEYS, type EvaluationRow, type RatingFieldKey } from '../types/evaluation'
import { supabase } from './supabase'

type DbEvaluation = {
  id: string
  evaluator_name: string | null
  training_title: string
  contact_number: string | null
  venue: string | null
  training_date: string
  areas_for_improvement: string | null
  future_suggestions: string | null
  meals_refreshments: number | null
} & Record<Exclude<RatingFieldKey, 'meals_refreshments'>, number>

function mapDbRowToEvaluation(row: DbEvaluation): EvaluationRow {
  const ratings = Object.fromEntries(
    RATING_FIELD_KEYS.map((key) => [
      key,
      key === 'meals_refreshments'
        ? (row.meals_refreshments ?? 3)
        : row[key],
    ]),
  ) as Record<RatingFieldKey, number>

  return {
    id: row.id,
    evaluator_name: row.evaluator_name ?? '',
    training_title: row.training_title,
    contact_number: row.contact_number ?? '',
    venue: row.venue ?? '',
    training_date: row.training_date,
    areas_for_improvement: row.areas_for_improvement ?? '',
    future_suggestions: row.future_suggestions ?? '',
    ...ratings,
  }
}

function evaluationToInsert(row: EvaluationRow, userId: string | undefined) {
  return {
    evaluator_name: row.evaluator_name,
    training_title: row.training_title,
    contact_number: row.contact_number,
    venue: row.venue,
    training_date: row.training_date,
    areas_for_improvement: row.areas_for_improvement,
    future_suggestions: row.future_suggestions,
    meals_refreshments: row.meals_refreshments,
    created_by: userId ?? null,
    relevance_content_job: row.relevance_content_job,
    relevance_topics_needs: row.relevance_topics_needs,
    materials_organization: row.materials_organization,
    examples_practical: row.examples_practical,
    knowledge_expertise: row.knowledge_expertise,
    responded_queries: row.responded_queries,
    evidence_based: row.evidence_based,
    theory_practical: row.theory_practical,
    presentation_clear: row.presentation_clear,
    visual_aids: row.visual_aids,
    pacing_timing: row.pacing_timing,
    encouraged_participation: row.encouraged_participation,
    confidence_feedback: row.confidence_feedback,
    courtesy_professionalism: row.courtesy_professionalism,
    rapport_participants: row.rapport_participants,
    gained_knowledge: row.gained_knowledge,
    apply_learning: row.apply_learning,
    competence_improved: row.competence_improved,
    inspired_learning: row.inspired_learning,
    venue_conducive: row.venue_conducive,
    av_equipment: row.av_equipment,
    schedule_pacing: row.schedule_pacing,
    support_staff: row.support_staff,
    overall_satisfaction: row.overall_satisfaction,
    recommend_likelihood: row.recommend_likelihood,
  }
}

export async function fetchEvaluationsFromSupabase(): Promise<EvaluationRow[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .order('training_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as DbEvaluation[]).map(mapDbRowToEvaluation)
}

export async function insertEvaluationsToSupabase(
  rows: EvaluationRow[],
  fileName: string,
  userId: string | undefined,
): Promise<void> {
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      source: fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
      file_name: fileName,
      row_count: rows.length,
      imported_by: userId ?? null,
      notes: 'Imported from Evaluation Tracker app',
    })
    .select('id')
    .single()

  if (batchError) {
    throw new Error(batchError.message)
  }

  const payload = rows.map((row) => ({
    ...evaluationToInsert(row, userId),
    import_batch_id: batch.id,
  }))

  const { error: insertError } = await supabase.from('evaluations').insert(payload)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function deleteAllEvaluationsFromSupabase(): Promise<void> {
  const { error } = await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    throw new Error(error.message)
  }
}
