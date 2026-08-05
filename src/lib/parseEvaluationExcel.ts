import * as XLSX from 'xlsx'
import {
  EVALUATION_CSV_HEADERS,
  RATING_FIELD_KEYS,
  RATING_SCALE_MAX,
  type EvaluationRow,
  type RatingFieldKey,
} from '../types/evaluation'
import type { CsvParseResult } from './parseEvaluationCsv'

const GOOGLE_FORM_SHEET = 'Form Responses 1'

type GoogleFormColumns = {
  timestamp: number
  name: number
  contact: number
  trainingTitle: number
  venue: number
  trainingDate: number
  ratingsStart: number
  areasForImprovement: number
  futureSuggestions: number
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return String(value).trim()
}

function parseTrainingDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  const text = cellText(value)
  if (!text) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }

  const serial = Number(text)
  if (Number.isFinite(serial) && serial > 0) {
    const utcDays = serial >= 60 ? serial - 1 : serial
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(utcDays) * 86_400_000)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  const usMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0')
    const day = usMatch[2].padStart(2, '0')
    return `${usMatch[3]}-${month}-${day}`
  }

  const parsed = Date.parse(text)
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10)
  }

  return ''
}

function headerIndex(headers: string[], ...needles: string[]): number {
  const index = headers.findIndex((header) =>
    needles.some((needle) => header.includes(needle)),
  )
  return index >= 0 ? index : -1
}

function buildGoogleFormColumns(headerRow: unknown[]): GoogleFormColumns | null {
  const headers = headerRow.map((cell) => cellText(cell).toLowerCase())

  const timestamp = headerIndex(headers, 'timestamp')
  const name = headerIndex(headers, 'name')
  const contact = headerIndex(headers, 'contact')
  const trainingTitle = headerIndex(headers, 'training title', 'title of training', 'program title')
  const venue = headerIndex(headers, 'venue')
  const trainingDate = headerIndex(headers, 'date/s', 'date/s attended', 'training date', 'date attended')

  if (trainingTitle < 0) {
    return null
  }

  const ratingsStart =
    trainingDate >= 0
      ? trainingDate + 1
      : venue >= 0
        ? venue + 1
        : trainingTitle + 3

  let areasForImprovement = headerIndex(
    headers,
    'areas for improvement',
    'area for improvement',
    'improvement',
  )
  let futureSuggestions = headerIndex(
    headers,
    'future topics',
    'future training',
    'suggestions',
    'recommend',
  )

  if (areasForImprovement < 0) {
    areasForImprovement = headers.length - 2
  }
  if (futureSuggestions < 0) {
    futureSuggestions = headers.length - 1
  }

  return {
    timestamp: timestamp >= 0 ? timestamp : 0,
    name: name >= 0 ? name : 1,
    contact: contact >= 0 ? contact : 2,
    trainingTitle,
    venue: venue >= 0 ? venue : trainingTitle + 1,
    trainingDate: trainingDate >= 0 ? trainingDate : trainingTitle + 2,
    ratingsStart,
    areasForImprovement,
    futureSuggestions,
  }
}

function parseRating(value: unknown, field: string, rowNumber: number): number | string {
  const text = cellText(value)
  if (!text) {
    return `Row ${rowNumber}: "${field}" must be an integer from 1 to ${RATING_SCALE_MAX}.`
  }

  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > RATING_SCALE_MAX || !Number.isInteger(parsed)) {
    return `Row ${rowNumber}: "${field}" must be an integer from 1 to ${RATING_SCALE_MAX}.`
  }

  return parsed
}

function isGoogleFormHeaderRow(row: unknown[]): boolean {
  const first = cellText(row[0]).toLowerCase()
  const headers = row.map((cell) => cellText(cell).toLowerCase())
  return (
    first.includes('timestamp') ||
    first.includes('time stamp') ||
    headers.some((header) => header.includes('training title'))
  )
}

function isNormalizedHeaderRow(row: unknown[]): boolean {
  const headers = row.map((cell) => cellText(cell).toLowerCase())
  return EVALUATION_CSV_HEADERS.every((header) => headers.includes(header))
}

function parseGoogleFormRows(data: unknown[][], columns: GoogleFormColumns, stamp: number): CsvParseResult {
  const rows: EvaluationRow[] = []
  const warnings: string[] = []

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex] as unknown[]
    const rowNumber = rowIndex + 1

    if (!row || row.every((cell) => cellText(cell) === '')) {
      continue
    }

    const trainingTitle = cellText(row[columns.trainingTitle])
    let trainingDate = parseTrainingDate(row[columns.trainingDate])

    if (!trainingDate && columns.timestamp >= 0) {
      trainingDate = parseTrainingDate(row[columns.timestamp])
    }

    if (!trainingTitle || !trainingDate) {
      warnings.push(
        `Row ${rowNumber}: training title and date are required (title: "${trainingTitle || 'empty'}", date: "${cellText(row[columns.trainingDate]) || 'empty'}").`,
      )
      continue
    }

    const rawRatings = row.slice(columns.ratingsStart, columns.ratingsStart + 25).map((value) => cellText(value))
    if (rawRatings.length < 25) {
      warnings.push(`Row ${rowNumber}: expected 25 rating columns from Google Form export.`)
      continue
    }

    const ratings: Partial<Record<RatingFieldKey, number>> = {}
    let ratingError: string | null = null

    for (let index = 0; index < 19; index += 1) {
      const field = RATING_FIELD_KEYS[index]
      const result = parseRating(rawRatings[index], field, rowNumber)
      if (typeof result === 'string') {
        ratingError = result
        break
      }
      ratings[field] = result
    }

    const tailFields: Array<[RatingFieldKey, unknown]> = [
      ['venue_conducive', rawRatings[19]],
      ['av_equipment', rawRatings[20]],
      ['schedule_pacing', rawRatings[21]],
      ['support_staff', rawRatings[22]],
      ['overall_satisfaction', rawRatings[23]],
      ['recommend_likelihood', rawRatings[24]],
    ]

    if (!ratingError) {
      for (const [field, value] of tailFields) {
        const result = parseRating(value, field, rowNumber)
        if (typeof result === 'string') {
          ratingError = result
          break
        }
        ratings[field] = result
      }
    }

    if (ratingError) {
      warnings.push(ratingError)
      continue
    }

    ratings.meals_refreshments = 3

    rows.push({
      id: `IMP-${stamp}-${rows.length + 1}`,
      evaluator_name: cellText(row[columns.name]),
      training_title: trainingTitle,
      contact_number: cellText(row[columns.contact]),
      venue: cellText(row[columns.venue]),
      training_date: trainingDate,
      areas_for_improvement: cellText(row[columns.areasForImprovement]),
      future_suggestions: cellText(row[columns.futureSuggestions]),
      ...(ratings as Record<RatingFieldKey, number>),
    })
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        warnings[0] ??
        'No valid rows found. Export your Google Form as .xlsx (Responses tab).',
    }
  }

  return { ok: true, rows, warnings }
}

function parseNormalizedExcelRows(data: unknown[][], stamp: number): CsvParseResult {
  const headers = (data[0] as unknown[]).map((cell) => cellText(cell).toLowerCase())
  const indexOf = Object.fromEntries(
    EVALUATION_CSV_HEADERS.map((header) => [header, headers.indexOf(header)]),
  ) as Record<(typeof EVALUATION_CSV_HEADERS)[number], number>

  const rows: EvaluationRow[] = []
  const warnings: string[] = []

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex] as unknown[]
    const rowNumber = rowIndex + 1

    if (!row || row.every((cell) => cellText(cell) === '')) {
      continue
    }

    const ratings: Partial<Record<RatingFieldKey, number>> = {}
    let ratingError: string | null = null

    for (const field of RATING_FIELD_KEYS) {
      const result = parseRating(row[indexOf[field]], field, rowNumber)
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

    const trainingTitle = cellText(row[indexOf.training_title])
    const trainingDate = parseTrainingDate(row[indexOf.training_date])

    if (!trainingTitle || !trainingDate) {
      warnings.push(`Row ${rowNumber}: training_title and training_date are required.`)
      continue
    }

    rows.push({
      id: `IMP-${stamp}-${rows.length + 1}`,
      evaluator_name: cellText(row[indexOf.evaluator_name]),
      training_title: trainingTitle,
      contact_number: cellText(row[indexOf.contact_number]),
      venue: cellText(row[indexOf.venue]),
      training_date: trainingDate,
      areas_for_improvement: cellText(row[indexOf.areas_for_improvement]),
      future_suggestions: cellText(row[indexOf.future_suggestions]),
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

export function parseEvaluationExcel(buffer: ArrayBuffer): CsvParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames.includes(GOOGLE_FORM_SHEET)
    ? GOOGLE_FORM_SHEET
    : workbook.SheetNames[0]

  if (!sheetName) {
    return { ok: false, error: 'The Excel file has no worksheets.' }
  }

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  }) as unknown[][]

  if (data.length < 2) {
    return { ok: false, error: 'Excel must include a header row and at least one data row.' }
  }

  const stamp = Date.now()
  const headerRow = data[0] as unknown[]

  if (isGoogleFormHeaderRow(headerRow)) {
    const columns = buildGoogleFormColumns(headerRow)
    if (!columns) {
      return {
        ok: false,
        error: 'Could not find a Training Title column in the Google Form Excel file.',
      }
    }
    return parseGoogleFormRows(data, columns, stamp)
  }

  if (isNormalizedHeaderRow(headerRow)) {
    return parseNormalizedExcelRows(data, stamp)
  }

  return {
    ok: false,
    error:
      'Unrecognized Excel format. Upload the Google Form .xlsx export (Responses), or use the app template columns.',
  }
}

export function isExcelFileName(fileName: string): boolean {
  return /\.xlsx?$/i.test(fileName)
}
