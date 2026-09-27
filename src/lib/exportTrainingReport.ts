import type { EvaluationStats } from './computeEvaluationStats'
import type { TrainingSummary } from './buildTrainingSummaries'
import type { EvaluationRow } from '../types/evaluation'
import { PART_VI_SECTION, RATING_SCALE_MAX } from '../types/evaluation'

const BENCHMARK_SCORE = 3.5

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatComments(rows: EvaluationRow[]): string {
  const blocks: string[] = []

  for (const row of rows) {
    const improvement = row.areas_for_improvement.trim()
    const suggestion = row.future_suggestions.trim()

    if (!improvement && !suggestion) {
      continue
    }

    blocks.push(`
      <div class="comment">
        <p class="comment-meta">${escapeHtml(row.evaluator_name || 'Anonymous')} · ${escapeHtml(row.training_date)}</p>
        ${improvement ? `<p><strong>Improve:</strong> ${escapeHtml(improvement)}</p>` : ''}
        ${suggestion ? `<p><strong>Suggest:</strong> ${escapeHtml(suggestion)}</p>` : ''}
      </div>
    `)
  }

  if (blocks.length === 0) {
    return '<p class="muted">No Part VI comments recorded.</p>'
  }

  return blocks.join('')
}

export function openTrainingReportWindow(options: {
  training: TrainingSummary
  stats: EvaluationStats
  rows: EvaluationRow[]
}) {
  const { training, stats, rows } = options
  const generatedAt = new Date().toLocaleString()
  const meetsBenchmark = stats.overallAverage >= BENCHMARK_SCORE

  const sectionRows = stats.sections
    .map(
      (section) => `
        <tr>
          <td>${escapeHtml(section.label)}</td>
          <td class="num">${section.average.toFixed(2)}</td>
          <td class="num">${section.percent}%</td>
        </tr>
      `,
    )
    .join('')

  const distributionRows = stats.ratingDistribution
    .map(
      (item) => `
        <tr>
          <td>Score ${item.score}</td>
          <td class="num">${item.count}</td>
          <td class="num">${item.percent}%</td>
        </tr>
      `,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(training.trainingTitle)} — Evaluation Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #0a1f3d; margin: 0; padding: 32px; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 1.75rem; }
    h2 { margin: 28px 0 12px; font-size: 1.1rem; color: #003d82; border-bottom: 2px solid #d6e8f7; padding-bottom: 6px; }
    .meta { color: #5a6f8c; font-size: 0.9rem; margin-bottom: 24px; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #c8d9ef; border-radius: 12px; padding: 14px; background: #f7faff; }
    .card strong { display: block; font-size: 1.4rem; margin-top: 4px; }
    .card span { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6f8c; }
    .benchmark { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .benchmark.pass { background: #d1fae5; color: #047857; }
    .benchmark.fail { background: #fef3c7; color: #b45309; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.92rem; }
    th, td { border: 1px solid #c8d9ef; padding: 8px 10px; text-align: left; }
    th { background: #eef4fc; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .comment { border: 1px solid #c8d9ef; border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #fff; }
    .comment-meta { margin: 0 0 6px; font-size: 0.8rem; color: #5a6f8c; }
    .muted { color: #5a6f8c; }
    footer { margin-top: 32px; font-size: 0.8rem; color: #5a6f8c; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <p class="no-print muted">Use your browser print dialog and choose “Save as PDF”.</p>
  <h1>${escapeHtml(training.trainingTitle)}</h1>
  <p class="meta">DOST RO2 Training Evaluation Report · Generated ${escapeHtml(generatedAt)}</p>

  <div class="cards">
    <div class="card"><span>Overall score</span><strong>${stats.overallAverage.toFixed(2)}</strong></div>
    <div class="card"><span>Responses</span><strong>${stats.totalResponses}</strong></div>
    <div class="card"><span>Agree / Excellent</span><strong>${stats.positivePercent}%</strong></div>
    <div class="card"><span>Sessions</span><strong>${training.dates.length}</strong></div>
  </div>

  <p class="benchmark ${meetsBenchmark ? 'pass' : 'fail'}">
    Regional benchmark: ${BENCHMARK_SCORE.toFixed(1)} / ${RATING_SCALE_MAX}.0 —
    ${meetsBenchmark ? 'Meets target' : 'Below target'}
  </p>

  <h2>Parts I–V section scores</h2>
  <table>
    <thead><tr><th>Section</th><th>Average</th><th>% of scale</th></tr></thead>
    <tbody>${sectionRows}</tbody>
  </table>

  <h2>Rating distribution</h2>
  <table>
    <thead><tr><th>Score</th><th>Count</th><th>Share</th></tr></thead>
    <tbody>${distributionRows}</tbody>
  </table>

  <h2>${escapeHtml(PART_VI_SECTION.title)}</h2>
  ${formatComments(rows)}

  <footer>Evaluation Tracker · DOST Regional Office No. 02</footer>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')
  if (!popup) {
    throw new Error('Pop-up blocked. Allow pop-ups to download the report.')
  }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}
