import type { EvaluationStats } from './computeEvaluationStats'
import type { TrainingSummary } from './buildTrainingSummaries'
import type { EvaluationRow } from '../types/evaluation'
import { EVALUATION_SECTIONS, PART_VI_SECTION, RATING_SCALE_MAX } from '../types/evaluation'

const BENCHMARK_SCORE = 3.5
const PAGE_MARGIN = 14
const FOOTER_Y = 285

function safeFileName(value: string): string {
  return value.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'training-report'
}

type PdfDoc = import('jspdf').jsPDF

function ensurePage(doc: PdfDoc, y: number, needed = 20): number {
  if (y + needed <= FOOTER_Y) {
    return y
  }

  doc.addPage()
  return PAGE_MARGIN + 8
}

function writeSectionHeading(doc: PdfDoc, title: string, y: number): number {
  y = ensurePage(doc, y, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 61, 130)
  doc.text(title, PAGE_MARGIN, y)
  doc.setDrawColor(198, 217, 239)
  doc.line(PAGE_MARGIN, y + 2, 196, y + 2)
  doc.setTextColor(10, 31, 61)
  return y + 10
}

function writeBodyText(doc: PdfDoc, text: string, y: number, maxWidth = 182): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const lines = doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    y = ensurePage(doc, y, 6)
    doc.text(line, PAGE_MARGIN, y)
    y += 5
  }
  return y + 2
}

async function createPdfDocument(): Promise<{
  doc: PdfDoc
  autoTable: typeof import('jspdf-autotable').default
}> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  return { doc: new jsPDF({ unit: 'mm', format: 'a4' }), autoTable }
}

function addPageNumbers(doc: PdfDoc): void {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(90, 111, 140)
    doc.text(
      `Evaluation Tracker · DOST RO2 · Page ${page} of ${pageCount}`,
      PAGE_MARGIN,
      292,
    )
  }
}

function buildTrainingReportPdf(options: {
  training: TrainingSummary
  stats: EvaluationStats
  rows: EvaluationRow[]
}): Promise<PdfDoc> {
  const { training, stats, rows } = options

  return createPdfDocument().then(({ doc, autoTable }) => {
    const generatedAt = new Date().toLocaleString()
    const meetsBenchmark = stats.overallAverage >= BENCHMARK_SCORE
    let y = PAGE_MARGIN

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(10, 31, 61)
    const titleLines = doc.splitTextToSize(training.trainingTitle, 182)
    doc.text(titleLines, PAGE_MARGIN, y)
    y += titleLines.length * 7 + 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90, 111, 140)
    doc.text(`DOST RO2 Training Evaluation Report · Generated ${generatedAt}`, PAGE_MARGIN, y)
    y += 10

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(10, 31, 61)
    doc.text(`Overall score: ${stats.overallAverage.toFixed(2)} / ${RATING_SCALE_MAX}.0`, PAGE_MARGIN, y)
    doc.text(`Responses: ${stats.totalResponses}`, 80, y)
    doc.text(`Agree / Excellent: ${stats.positivePercent}%`, 120, y)
    doc.text(`Sessions: ${training.dates.length}`, 170, y)
    y += 8

    doc.setFontSize(9)
    doc.setTextColor(meetsBenchmark ? 4 : 180, meetsBenchmark ? 120 : 83, meetsBenchmark ? 87 : 9)
    doc.text(
      `Regional benchmark ${BENCHMARK_SCORE.toFixed(1)} — ${meetsBenchmark ? 'Meets target' : 'Below target'}`,
      PAGE_MARGIN,
      y,
    )
    doc.setTextColor(10, 31, 61)
    y += 10

    y = writeSectionHeading(doc, 'Per-statement scores (Parts I–V)', y)
    y = writeBodyText(
      doc,
      'Each evaluation statement with average score across all responses.',
      y,
    )

    for (const section of EVALUATION_SECTIONS) {
      const statementRows = stats.statements
        .filter((statement) => statement.sectionId === section.id)
        .map((statement, index) => [
          String(index + 1),
          statement.label,
          statement.average.toFixed(2),
          `${statement.percent}%`,
        ])

      y = ensurePage(doc, y, 24)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(section.title, PAGE_MARGIN, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['#', 'Statement', 'Average', '% of scale']],
        body: statementRows,
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: [238, 244, 252], textColor: [10, 31, 61], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 8, halign: 'right' },
          1: { cellWidth: 130 },
          2: { cellWidth: 18, halign: 'right' },
          3: { cellWidth: 18, halign: 'right' },
        },
      })

      y = (doc as PdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    }

    y = writeSectionHeading(doc, 'Section summary', y)
    autoTable(doc, {
      startY: y,
      head: [['Section', 'Average', '% of scale']],
      body: stats.sections.map((section) => [
        section.label,
        section.average.toFixed(2),
        `${section.percent}%`,
      ]),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [238, 244, 252], textColor: [10, 31, 61], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    })

    y = (doc as PdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    y = writeSectionHeading(doc, 'Rating distribution', y)
    autoTable(doc, {
      startY: y,
      head: [['Score', 'Count', 'Share']],
      body: stats.ratingDistribution.map((item) => [
        String(item.score),
        String(item.count),
        `${item.percent}%`,
      ]),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [238, 244, 252], textColor: [10, 31, 61], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    })

    y = (doc as PdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    y = writeSectionHeading(doc, PART_VI_SECTION.title, y)

    const comments = rows.filter(
      (row) => row.areas_for_improvement.trim() || row.future_suggestions.trim(),
    )

    if (comments.length === 0) {
      y = writeBodyText(doc, 'No Part VI comments recorded.', y)
    } else {
      for (const row of comments) {
        y = ensurePage(doc, y, 18)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(`${row.evaluator_name || 'Anonymous'} · ${row.training_date}`, PAGE_MARGIN, y)
        y += 5

        if (row.areas_for_improvement.trim()) {
          y = writeBodyText(doc, `Improve: ${row.areas_for_improvement.trim()}`, y)
        }
        if (row.future_suggestions.trim()) {
          y = writeBodyText(doc, `Suggest: ${row.future_suggestions.trim()}`, y)
        }
        y += 4
      }
    }

    addPageNumbers(doc)
    return doc
  })
}

export async function downloadTrainingReportPdf(options: {
  training: TrainingSummary
  stats: EvaluationStats
  rows: EvaluationRow[]
}): Promise<void> {
  const { training } = options
  const doc = await buildTrainingReportPdf(options)
  doc.save(`${safeFileName(training.trainingTitle)}-evaluation-report.pdf`)
}
