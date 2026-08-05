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

function excelSerialToDate(serial: unknown): string {
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}/.test(serial.trim())) {
    return serial.trim().slice(0, 10)
  }

  const n = Number(serial)
  if (!Number.isFinite(n) || n === 0) {
    return ''
  }

  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000)
  return date.toISOString().slice(0, 10)
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
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
  return first.includes('timestamp') || first.includes('time stamp')
}

function isNormalizedHeaderRow(row: unknown[]): boolean {
  const headers = row.map((cell) => cellText(cell).toLowerCase())
  return EVALUATION_CSV_HEADERS.every((header) => headers.includes(header))
}

function parseGoogleFormRows(data: unknown[][], stamp: number): CsvParseResult {
  const rows: EvaluationRow[] = []
  const warnings: string[] = []

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex] as unknown[]
    const rowNumber = rowIndex + 1

    if (!row || row.every((cell) => cellText(cell) === '')) {
      continue
    }

    const trainingTitle = cellText(row[3])
    const trainingDate = excelSerialToDate(row[5])

    if (!trainingTitle || !trainingDate) {
      warnings.push(`Row ${rowNumber}: training title and date are required.`)
      continue
    }

    const rawRatings = row.slice(6, 31).map((value) => cellText(value))
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
      evaluator_name: cellText(row[1]),
      training_title: trainingTitle,
      contact_number: cellText(row[2]),
      venue: cellText(row[4]),
      training_date: trainingDate,
      areas_for_improvement: cellText(row[31]),
      future_suggestions: cellText(row[32]),
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
    const trainingDate = excelSerialToDate(row[indexOf.training_date])

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
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames.includes(GOOGLE_FORM_SHEET)
    ? GOOGLE_FORM_SHEET
    : workbook.SheetNames[0]

  if (!sheetName) {
    return { ok: false, error: 'The Excel file has no worksheets.' }
  }

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][]

  if (data.length < 2) {
    return { ok: false, error: 'Excel must include a header row and at least one data row.' }
  }

  const stamp = Date.now()
  const headerRow = data[0] as unknown[]

  if (isGoogleFormHeaderRow(headerRow)) {
    return parseGoogleFormRows(data, stamp)
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
