import type { ReactNode } from 'react'

type DashboardHeroStatProps = {
  label: string
  value: string
  hint: string
  icon: ReactNode
  highlight?: boolean
}

export function DashboardHeroStat({
  label,
  value,
  hint,
  icon,
  highlight = false,
}: DashboardHeroStatProps) {
  return (
    <div className={`dash-hero-stat ${highlight ? 'dash-hero-stat-highlight' : ''}`}>
      <div className="dash-hero-stat-icon">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="type-label text-muted">{label}</p>
        <p className="type-title-lg mt-2 tabular-nums text-ink">{value}</p>
        <p className="type-body mt-1.5 text-muted">{hint}</p>
      </div>
    </div>
  )
}
