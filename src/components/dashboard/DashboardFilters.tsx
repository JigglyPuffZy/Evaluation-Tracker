type DashboardFilter = 'all' | 'strong' | 'attention' | 'duplicates'

type DashboardFiltersProps = {
  search: string
  filter: DashboardFilter
  onSearchChange: (value: string) => void
  onFilterChange: (value: DashboardFilter) => void
  resultCount: number
  totalCount: number
  duplicateCount?: number
}

const filterOptions: { id: DashboardFilter; label: string }[] = [
  { id: 'all', label: 'All programs' },
  { id: 'strong', label: 'Strong (≥ 3.5)' },
  { id: 'attention', label: 'Needs attention (< 3.0)' },
  { id: 'duplicates', label: 'Duplicates' },
]

export function DashboardFilters({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  resultCount,
  totalCount,
  duplicateCount = 0,
}: DashboardFiltersProps) {
  return (
    <div className="glass-panel space-y-3 rounded-2xl border border-line/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search trainings</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search training title…"
            className="h-10 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </label>
        <p className="shrink-0 text-xs text-muted">
          Showing {resultCount} of {totalCount}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const label =
            option.id === 'duplicates' && duplicateCount > 0
              ? `Duplicates (${duplicateCount})`
              : option.label

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange(option.id)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                filter === option.id
                  ? option.id === 'duplicates'
                    ? 'bg-warn text-white shadow-sm'
                    : 'bg-accent text-white shadow-sm'
                  : 'border border-line bg-card text-ink-soft hover:border-accent/30',
                option.id === 'duplicates' && filter !== option.id && duplicateCount > 0
                  ? 'border-warn/40 text-warn'
                  : '',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type { DashboardFilter }
