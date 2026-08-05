import {
  EVALUATION_CSV_HEADERS,
  RATING_FIELD_KEYS,
  RATING_SCALE_MAX,
  type EvaluationRow,
  type RatingFieldKey,
} from '../types/evaluation'

export type CsvParseResult =
  | { ok: true; rows: EvaluationRow[]; warnings: string[] }
  | { ok: false; error: string }

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseRating(value: string, field: string, rowNumber: number): number | string {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > RATING_SCALE_MAX || !Number.isInteger(parsed)) {
    return `Row ${rowNumber}: "${field}" must be an integer from 1 to ${RATING_SCALE_MAX}.`
  }
  return parsed
}

export function parseEvaluationCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return { ok: false, error: 'CSV must include a header row and at least one data row.' }
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase())
  const missing = EVALUATION_CSV_HEADERS.filter((header) => !headers.includes(header))

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required columns: ${missing.join(', ')}.`,
    }
  }

  const indexOf = Object.fromEntries(
    EVALUATION_CSV_HEADERS.map((header) => [header, headers.indexOf(header)]),
  ) as Record<(typeof EVALUATION_CSV_HEADERS)[number], number>

  const rows: EvaluationRow[] = []
  const warnings: string[] = []
  const stamp = Date.now()

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1
    const cells = splitCsvLine(lines[lineIndex])

    if (cells.every((cell) => cell === '')) {
      continue
    }

    const ratings: Partial<Record<RatingFieldKey, number>> = {}
    let ratingError: string | null = null

    for (const field of RATING_FIELD_KEYS) {
      const result = parseRating(cells[indexOf[field]] ?? '', field, rowNumber)
      if (typeof result === 'string') {
        ratingError = result
        break
      }
      ratings[field] = result
    }

    if (ratingError) {
      warnings.push(ratingError)
      continue
    }

    const trainingTitle = cells[indexOf.training_title] ?? ''
    const trainingDate = cells[indexOf.training_date] ?? ''

    if (!trainingTitle || !trainingDate) {
      warnings.push(`Row ${rowNumber}: training_title and training_date are required.`)
      continue
    }

    const baseRow = {
      id: `IMP-${stamp}-${rows.length + 1}`,
      evaluator_name: cells[indexOf.evaluator_name] ?? '',
      training_title: trainingTitle,
      contact_number: cells[indexOf.contact_number] ?? '',
      venue: cells[indexOf.venue] ?? '',
      training_date: trainingDate,
      areas_for_improvement: cells[indexOf.areas_for_improvement] ?? '',
      future_suggestions: cells[indexOf.future_suggestions] ?? '',
    }

    rows.push({
      ...baseRow,
      ...(ratings as Record<RatingFieldKey, number>),
    })
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        warnings[0] ??
        `No valid evaluation rows were found. Check rating columns use integers 1–${RATING_SCALE_MAX}.`,
    }
  }

  return { ok: true, rows, warnings }
}

function sampleRow(
  evaluator: string,
  title: string,
  date: string,
  venue: string,
  ratings: number[],
  improvement: string,
  suggestions: string,
): string {
  const contact = evaluator ? '+639912345678' : ''
  const fields = [
    evaluator,
    title,
    contact,
    venue,
    date,
    ...ratings.map(String),
    improvement,
    suggestions,
  ]
  return fields.map((field) => `"${field.replace(/"/g, '""')}"`).join(',')
}

export function buildSampleCsv(): string {
  const header = EVALUATION_CSV_HEADERS.join(',')
  const rating4 = Array(26).fill(4)
  const rating3 = Array(26).fill(3)

  const sampleRows = [
    sampleRow(
      'Maria Santos',
      'Gender and Development Mainstreaming',
      '2026-07-15',
      'DOST RO2 Training Hall',
      rating4,
      'More hands-on workshops',
      'Project management and data analytics',
    ),
    sampleRow(
      '',
      'Gender and Development Mainstreaming',
      '2026-07-15',
      'DOST RO2 Training Hall',
      rating3,
      'Longer Q&A sessions',
      'Leadership and communication skills',
    ),
    sampleRow(
      'Juan Dela Cruz',
      'Basic Research Ethics',
      '2026-07-22',
      'Tuguegarao City Convention Center',
      rating4,
      'None',
      'Advanced research methods',
    ),
  ]

  return [header, ...sampleRows].join('\n')
}

function escapeCsvCell(value: string | number): string {
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildEvaluationCsv(rows: EvaluationRow[]): string {
  const header = EVALUATION_CSV_HEADERS.join(',')
  const dataLines = rows.map((row) =>
    EVALUATION_CSV_HEADERS.map((header) => {
      if (header in row) {
        return escapeCsvCell(row[header as keyof EvaluationRow] as string | number)
      }
      return ''
    }).join(','),
  )

  return [header, ...dataLines].join('\n')
}
