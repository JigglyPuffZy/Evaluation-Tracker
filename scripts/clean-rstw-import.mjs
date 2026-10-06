/**
 * Clean RSTW evaluation export and generate Supabase SQL import.
 *
 * Usage: node scripts/clean-rstw-import.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const ROOT = process.cwd()
const SOURCE = path.join(
  process.env.USERPROFILE ?? '',
  'Downloads',
  'rstw-evaluations (1).xlsx',
)
const OUT_XLSX = path.join(ROOT, 'supabase', 'rstw-evaluations-clean.xlsx')
const OUT_SQL = path.join(ROOT, 'supabase', 'rstw-import.sql')

const CLEAN_HEADERS = [
  'Type',
  'Scope',
  'Participant',
  'Submitted',
  'Training Content',
  'Speaker Ratings',
  'Learning Outcomes',
  'Logistics',
  'Training Overall',
  'Improvements',
  'Future Topics',
  'Summary comment',
]

/** Columns E–Q (index 4–16) — CSF / non-training evaluation. */
const DROP_START = 4
const DROP_END = 16

function cellText(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function parseSubmitted(value) {
  const text = cellText(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }
  const parsed = Date.parse(text)
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10)
  }
  return '2026-09-15'
}

function parseSubmittedTimestamp(value) {
  const text = cellText(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return text.replace(/\.\d{3}Z$/, 'Z')
  }
  const parsed = Date.parse(text)
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString()
  }
  return `${parseSubmitted(value)}T12:00:00Z`
}

function parseKeyValues(text, keys) {
  const result = {}
  for (const key of keys) {
    const match = String(text).match(new RegExp(`${key}:\\s*(\\d+)`, 'i'))
    if (!match) {
      return null
    }
    result[key] = Number(match[1])
  }
  return result
}

function parseSpeaker(text) {
  const source = String(text)
  const read = (label) => {
    const match = source.match(new RegExp(`${label}\\s*(\\d)\\s*/\\s*4`, 'i'))
    return match ? Number(match[1]) : null
  }
  const knowledge = read('knowledge')
  const queries = read('queries')
  const delivery = read('delivery')
  const approachability = read('approachability')
  if ([knowledge, queries, delivery, approachability].some((value) => value === null)) {
    return null
  }
  return { knowledge, queries, delivery, approachability }
}

function avg(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) {
    return 3
  }
  return Math.max(1, Math.min(4, Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length)))
}

function sqlText(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`
}

function sqlTimestamp(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return `timezone('utc', timestamp '2026-09-15 00:00:00')`
  }
  const pad = (value) => String(value).padStart(2, '0')
  const stamp = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  return `timezone('utc', timestamp '${stamp}')`
}

if (!fs.existsSync(SOURCE)) {
  console.error(`Source file not found: ${SOURCE}`)
  process.exit(1)
}

const workbook = XLSX.readFile(SOURCE)
const sheetName = workbook.SheetNames[0]
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' })

const cleanRows = [CLEAN_HEADERS]
const sqlRows = []
const warnings = []

for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index]
  if (!row.some((cell) => cellText(cell))) {
    continue
  }

  const type = cellText(row[0])
  const scope = cellText(row[1])
  const participant = cellText(row[2])
  const submitted = cellText(row[3])
  const trainingContent = cellText(row[17])
  const speakerRatings = cellText(row[18])
  const learningOutcomes = cellText(row[19])
  const logistics = cellText(row[20])
  const trainingOverall = cellText(row[21])
  const improvements = cellText(row[22])
  const futureTopics = cellText(row[23])
  const summaryComment = cellText(row[24])

  cleanRows.push([
    type,
    scope,
    participant,
    submitted,
    trainingContent,
    speakerRatings,
    learningOutcomes,
    logistics,
    trainingOverall,
    improvements,
    futureTopics,
    summaryComment,
  ])

  const content = parseKeyValues(trainingContent, ['rel', 'app', 'mat', 'prac'])
  const speaker = parseSpeaker(speakerRatings)
  const learning = parseKeyValues(learningOutcomes, ['gain', 'apply', 'comp'])
  const log = parseKeyValues(logistics, ['venue', 'av', 'sched', 'meal', 'staff'])
  const overall = parseKeyValues(trainingOverall, ['sat', 'rec'])

  if (!content || !speaker || !learning || !log || !overall) {
    warnings.push(`Row ${index + 1}: skipped — could not parse ratings (${scope})`)
    continue
  }

  if (!scope) {
    warnings.push(`Row ${index + 1}: skipped — missing scope`)
    continue
  }

  const speakerAvg = avg([speaker.knowledge, speaker.queries, speaker.delivery, speaker.approachability])
  const learningAvg = avg([learning.gain, learning.apply, learning.comp])

  sqlRows.push({
    submitted_at: parseSubmittedTimestamp(submitted),
    training_date: parseSubmitted(submitted),
    evaluator_name: participant || 'Anonymous',
    training_title: scope,
    venue: 'RSTW 2026',
    relevance_content_job: content.rel,
    relevance_topics_needs: content.app,
    materials_organization: content.mat,
    examples_practical: content.prac,
    knowledge_expertise: speaker.knowledge,
    responded_queries: speaker.queries,
    evidence_based: speakerAvg,
    theory_practical: speaker.delivery,
    presentation_clear: speaker.delivery,
    visual_aids: speakerAvg,
    pacing_timing: speakerAvg,
    encouraged_participation: speaker.approachability,
    confidence_feedback: speakerAvg,
    courtesy_professionalism: speaker.approachability,
    rapport_participants: speaker.approachability,
    gained_knowledge: learning.gain,
    apply_learning: learning.apply,
    competence_improved: learning.comp,
    inspired_learning: learning.comp,
    venue_conducive: log.venue,
    av_equipment: log.av,
    schedule_pacing: log.sched,
    meals_refreshments: log.meal,
    support_staff: log.staff,
    overall_satisfaction: overall.sat,
    recommend_likelihood: overall.rec,
    areas_for_improvement: improvements || summaryComment || '',
    future_suggestions: futureTopics || summaryComment || '',
  })
}

const outWb = XLSX.utils.book_new()
const outWs = XLSX.utils.aoa_to_sheet(cleanRows)
XLSX.utils.book_append_sheet(outWb, outWs, 'RSTW Clean')
XLSX.writeFile(outWb, OUT_XLSX)

const valueLines = sqlRows
  .map(
    (row) =>
      `  (${sqlTimestamp(row.submitted_at)}, ${sqlText(row.evaluator_name)}, '', ${sqlText(row.training_title)}, ${sqlText(row.venue)}, '${row.training_date}'::date, ${row.relevance_content_job}, ${row.relevance_topics_needs}, ${row.materials_organization}, ${row.examples_practical}, ${row.knowledge_expertise}, ${row.responded_queries}, ${row.evidence_based}, ${row.theory_practical}, ${row.presentation_clear}, ${row.visual_aids}, ${row.pacing_timing}, ${row.encouraged_participation}, ${row.confidence_feedback}, ${row.courtesy_professionalism}, ${row.rapport_participants}, ${row.gained_knowledge}, ${row.apply_learning}, ${row.competence_improved}, ${row.inspired_learning}, ${row.venue_conducive}, ${row.av_equipment}, ${row.schedule_pacing}, ${row.meals_refreshments}, ${row.support_staff}, ${row.overall_satisfaction}, ${row.recommend_likelihood}, ${sqlText(row.areas_for_improvement)}, ${sqlText(row.future_suggestions)})`,
  )
  .join(',\n')

const sql = `-- =============================================================================
-- RSTW 2026 evaluations — cleaned import (CSF columns E–Q removed)
-- Generated: ${new Date().toISOString()}
-- Rows: ${sqlRows.length} (from ${rows.length - 1} source rows)
--
-- How to run:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this file → Run
--   3. Requires setup.sql schema already applied
-- =============================================================================

with batch as (
  insert into public.import_batches (source, file_name, row_count, notes)
  values (
    'excel',
    'rstw-evaluations-clean.xlsx',
    ${sqlRows.length},
    'RSTW 2026 — cleaned import'
  )
  returning id
)
insert into public.evaluations (
  import_batch_id,
  submitted_at,
  evaluator_name,
  contact_number,
  training_title,
  venue,
  training_date,
  relevance_content_job,
  relevance_topics_needs,
  materials_organization,
  examples_practical,
  knowledge_expertise,
  responded_queries,
  evidence_based,
  theory_practical,
  presentation_clear,
  visual_aids,
  pacing_timing,
  encouraged_participation,
  confidence_feedback,
  courtesy_professionalism,
  rapport_participants,
  gained_knowledge,
  apply_learning,
  competence_improved,
  inspired_learning,
  venue_conducive,
  av_equipment,
  schedule_pacing,
  meals_refreshments,
  support_staff,
  overall_satisfaction,
  recommend_likelihood,
  areas_for_improvement,
  future_suggestions
)
select
  batch.id,
  v.submitted_at,
  v.evaluator_name,
  v.contact_number,
  v.training_title,
  v.venue,
  v.training_date,
  v.relevance_content_job,
  v.relevance_topics_needs,
  v.materials_organization,
  v.examples_practical,
  v.knowledge_expertise,
  v.responded_queries,
  v.evidence_based,
  v.theory_practical,
  v.presentation_clear,
  v.visual_aids,
  v.pacing_timing,
  v.encouraged_participation,
  v.confidence_feedback,
  v.courtesy_professionalism,
  v.rapport_participants,
  v.gained_knowledge,
  v.apply_learning,
  v.competence_improved,
  v.inspired_learning,
  v.venue_conducive,
  v.av_equipment,
  v.schedule_pacing,
  v.meals_refreshments,
  v.support_staff,
  v.overall_satisfaction,
  v.recommend_likelihood,
  v.areas_for_improvement,
  v.future_suggestions
from batch
cross join (
  values
${valueLines.replace(/^/gm, '    ')}
) as v(
  submitted_at,
  evaluator_name,
  contact_number,
  training_title,
  venue,
  training_date,
  relevance_content_job,
  relevance_topics_needs,
  materials_organization,
  examples_practical,
  knowledge_expertise,
  responded_queries,
  evidence_based,
  theory_practical,
  presentation_clear,
  visual_aids,
  pacing_timing,
  encouraged_participation,
  confidence_feedback,
  courtesy_professionalism,
  rapport_participants,
  gained_knowledge,
  apply_learning,
  competence_improved,
  inspired_learning,
  venue_conducive,
  av_equipment,
  schedule_pacing,
  meals_refreshments,
  support_staff,
  overall_satisfaction,
  recommend_likelihood,
  areas_for_improvement,
  future_suggestions
);

select count(*) as rstw_rows_imported from public.evaluations
where training_title in (
  select distinct training_title from public.evaluations
  order by training_title desc
  limit 50
);

select title, response_count, average_score from public.training_stats
order by response_count desc
limit 15;
`

fs.writeFileSync(OUT_SQL, sql, 'utf8')

console.log(`Clean Excel: ${OUT_XLSX}`)
console.log(`SQL import:  ${OUT_SQL}`)
console.log(`Imported rows: ${sqlRows.length}`)
if (warnings.length > 0) {
  console.log('\nWarnings:')
  warnings.slice(0, 10).forEach((line) => console.log(' -', line))
  if (warnings.length > 10) {
    console.log(` - ... and ${warnings.length - 10} more`)
  }
}
