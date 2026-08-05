type BarItem = {
  label: string
  value: number
  max?: number
  display?: string
}

type VerticalBarChartProps = {
  items: BarItem[]
  unitSuffix?: string
}

export function VerticalBarChart({ items, unitSuffix = '%' }: VerticalBarChartProps) {
  const maxValue = Math.max(...items.map((item) => item.max ?? item.value), 1)

  return (
    <div className="flex h-56 items-end gap-3">
      {items.map((item, index) => {
        const height = Math.max(4, (item.value / maxValue) * 100)
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-xs tabular-nums text-muted">
              {item.display ?? `${item.value}${unitSuffix}`}
            </span>
            <div className="flex h-40 w-full items-end justify-center rounded-lg bg-accent-soft/35 px-1">
              <div
                className="animate-bar w-full max-w-9 rounded-md bg-accent"
                style={{
                  height: `${height}%`,
                  animationDelay: `${index * 50}ms`,
                }}
                title={`${item.label}: ${item.display ?? `${item.value}${unitSuffix}`}`}
              />
            </div>
            <span className="w-full truncate text-center text-xs font-medium text-muted">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
