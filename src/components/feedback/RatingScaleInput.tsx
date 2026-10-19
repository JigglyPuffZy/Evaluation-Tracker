import { RATING_BANDS, RATING_SCALE_MAX } from '../../types/evaluation'

type RatingScaleInputProps = {
  label: string
  value: number
  onChange: (score: number) => void
  name: string
}

export function RatingScaleInput({ label, value, onChange, name }: RatingScaleInputProps) {
  return (
    <fieldset className="public-form-question">
      <legend className="public-form-question-label">{label}</legend>
      <div className="public-form-scale" role="radiogroup" aria-label={label}>
        {RATING_BANDS.map((band) => {
          const selected = value === band.score
          return (
            <label
              key={band.score}
              className={[
                'public-form-scale-option',
                selected ? 'public-form-scale-option-selected' : '',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={band.score}
                checked={selected}
                onChange={() => onChange(band.score)}
                className="sr-only"
              />
              <span className="public-form-scale-score">{band.score}</span>
              <span className="public-form-scale-text">{band.label}</span>
            </label>
          )
        })}
      </div>
      <p className="public-form-scale-hint">1 = lowest · {RATING_SCALE_MAX} = highest</p>
    </fieldset>
  )
}
