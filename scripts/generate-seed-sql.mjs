import { writeFileSync } from 'node:fs'
import XLSX from 'xlsx'

const xlsxPath =
  'c:/Users/Jan Leianelle/Downloads/Training Evaluation Form (Responses).xlsx'
const outPath = new URL('../supabase/seed-from-excel.sql', import.meta.url)

const wb = XLSX.readFile(xlsxPath)
const data = XLSX.utils.sheet_to_json(wb.Sheets['Form Responses 1'], {
  header: 1,
  defval: '',
})

function excelDate(serial) {
  const n = Number(serial)
  if (!Number.isFinite(n) || n === 0) return null
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000)
  return d.toISOString().slice(0, 10)
}

function excelTs(serial) {
  const n = Number(serial)
  if (!Number.isFinite(n) || n === 0) return null
  const ms = Date.UTC(1899, 11, 30) + n * 86400000
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19)
}

function esc(value) {
  return String(value ?? '').replace(/'/g, "''")
}

const rows = data.slice(1).filter((row) => row.some((cell) => cell !== ''))

const lines = [
  '-- Auto-generated from Training Evaluation Form (Responses).xlsx',
  '-- Run AFTER supabase/schema.sql',
  `-- Rows: ${rows.length}`,
  '',
  "insert into public.import_batches (source, file_name, row_count, notes)",
  "values ('excel', 'Training Evaluation Form (Responses).xlsx', " +
    rows.length +
    ", 'Google Form export seed data');",
  '',
  'insert into public.evaluations (',
  '  submitted_at, evaluator_name, contact_number, training_title, venue, training_date,',
  '  relevance_content_job, relevance_topics_needs, materials_organization, examples_practical,',
  '  knowledge_expertise, responded_queries, evidence_based, theory_practical,',
  '  presentation_clear, visual_aids, pacing_timing, encouraged_participation,',
  '  confidence_feedback, courtesy_professionalism, rapport_participants,',
  '  gained_knowledge, apply_learning, competence_improved, inspired_learning,',
  '  venue_conducive, av_equipment, schedule_pacing, meals_refreshments, support_staff,',
  '  overall_satisfaction, recommend_likelihood, areas_for_improvement, future_suggestions',
  ') values',
]

const valueRows = rows.map((row) => {
  const ts = excelTs(row[0])
  const trainingDate = excelDate(row[5])
  const ratings = row.slice(6, 31).map((value) => {
    if (value === '') return 'null'
    return Number(value)
  })

  const part4 = ratings.slice(19, 24)
  const venueConducive = part4[0] ?? 'null'
  const avEquipment = part4[1] ?? 'null'
  const schedulePacing = part4[2] ?? 'null'
  const supportStaff = part4[3] ?? 'null'
  const overall = part4[4] ?? 'null'
  const recommend = ratings[24] ?? 'null'

  const submitted = ts ? `timezone('utc', timestamp '${ts}')` : 'null'

  return (
    `  (${submitted}, '${esc(row[1])}', '${esc(row[2])}', '${esc(row[3])}', '${esc(row[4])}', '${trainingDate}', ` +
    `${ratings.slice(0, 19).join(', ')}, ${venueConducive}, ${avEquipment}, ${schedulePacing}, null, ${supportStaff}, ${overall}, ${recommend}, '${esc(row[31])}', '${esc(row[32])}')`
  )
})

lines.push(valueRows.join(',\n') + ';')
lines.push('')
lines.push('-- Verify: select count(*) from public.evaluations;')
lines.push('-- select * from public.training_stats order by response_count desc;')

writeFileSync(outPath, lines.join('\n'))
console.log(`Wrote ${rows.length} rows to ${outPath.pathname}`)
