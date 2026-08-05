type Props = {
  score: number
  max?: number
}

export function RatingStars({ score, max = 5 }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${score} out of ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < Math.round(score)
        return (
          <span
            key={index}
            className={filled ? 'text-accent' : 'text-line'}
            aria-hidden="true"
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
