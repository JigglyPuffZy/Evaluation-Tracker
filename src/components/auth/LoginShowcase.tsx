/** Decorative bento preview for the login brand panel. */
export function LoginShowcase() {
  const bars = [68, 82, 74, 91, 78, 88, 85]

  return (
    <div className="login-gate-bento" aria-hidden="true">
      <article className="login-gate-tile login-gate-tile-stat">
        <span className="login-gate-tile-label">Programs</span>
        <strong className="login-gate-tile-value">10</strong>
        <span className="login-gate-tile-hint">Active trainings</span>
      </article>

      <article className="login-gate-tile login-gate-tile-stat login-gate-tile-accent">
        <span className="login-gate-tile-label">Responses</span>
        <strong className="login-gate-tile-value">23</strong>
        <span className="login-gate-tile-hint">Imported rows</span>
      </article>

      <article className="login-gate-tile login-gate-tile-score">
        <span className="login-gate-tile-label">Avg. score</span>
        <div className="login-gate-ring">
          <svg viewBox="0 0 80 80" className="login-gate-ring-svg">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="url(#login-gate-ring-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="160 200"
              className="login-gate-ring-progress"
            />
            <defs>
              <linearGradient id="login-gate-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4da3ff" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <span className="login-gate-ring-val">3.7</span>
        </div>
        <span className="login-gate-tile-hint">Out of 4.0</span>
      </article>

      <article className="login-gate-tile login-gate-tile-chart">
        <span className="login-gate-tile-label">Session scores</span>
        <div className="login-gate-bars">
          {bars.map((h, i) => (
            <span
              key={i}
              className="login-gate-bar"
              style={{ height: `${h}%`, animationDelay: `${0.15 + i * 0.06}s` }}
            />
          ))}
        </div>
      </article>

      <article className="login-gate-tile login-gate-tile-radar">
        <span className="login-gate-tile-label">Radar · Parts I–V</span>
        <svg viewBox="0 0 120 100" className="login-gate-radar-svg">
          <polygon
            points="60,10 105,38 88,88 32,88 15,38"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
          <polygon
            points="60,24 88,42 78,74 42,74 32,42"
            fill="rgba(77,163,255,0.22)"
            stroke="#4da3ff"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="10" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="105" cy="38" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="88" cy="88" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="32" cy="88" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="15" cy="38" r="2" fill="rgba(255,255,255,0.5)" />
        </svg>
      </article>
    </div>
  )
}
