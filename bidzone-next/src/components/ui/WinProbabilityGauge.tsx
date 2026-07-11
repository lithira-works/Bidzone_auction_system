'use client'
import { useId } from 'react'

type Props = { percent: number; seed?: string }

/** Confidence band for the readout under the dial. */
function confidenceBand(p: number): { label: string; color: string } {
  if (p < 30) return { label: 'Low chance', color: '#f87171' }
  if (p < 55) return { label: 'Fair chance', color: '#fbbf24' }
  if (p < 75) return { label: 'Strong chance', color: '#34d399' }
  return { label: 'Very strong', color: '#10b981' }
}

export function WinProbabilityGauge({ percent }: Props) {
  const gradId = useId().replace(/:/g, '')

  const clamped = Math.min(100, Math.max(0, percent))
  const band = confidenceBand(clamped)

  /* Geometry: semicircle opening downward */
  const cx = 80
  const cy = 78
  const r = 60
  const arcLen = Math.PI * r /* ≈ 188.5 */

  /* Needle: 0% → -90°, 100% → +90° (rotates around the hub) */
  const needleDeg = (clamped / 100) * 180 - 90

  /* Tick marks every 25% along the arc */
  const ticks = [0, 25, 50, 75, 100].map((p) => {
    const a = ((180 - (p / 100) * 180) * Math.PI) / 180
    const x1 = cx + (r - 11) * Math.cos(a)
    const y1 = cy - (r - 11) * Math.sin(a)
    const x2 = cx + (r - 5) * Math.cos(a)
    const y2 = cy - (r - 5) * Math.sin(a)
    return { p, x1, y1, x2, y2 }
  })

  return (
    <div className="win-prob">
      <div className="win-prob__gauge-wrap" aria-hidden>
        <svg className="win-prob__gauge" viewBox="0 0 160 92" width={180} height={104}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--bz-card-border)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Faint full-scale gradient (the "dial face") */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.22"
          />
          {/* Progress arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * arcLen} ${arcLen + 40}`}
            style={{ transition: 'stroke-dasharray 0.65s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
          />

          {/* Tick marks */}
          {ticks.map((tk) => (
            <line
              key={tk.p}
              x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke="var(--bz-text-dim)"
              strokeWidth={tk.p % 50 === 0 ? 2 : 1}
              opacity="0.55"
            />
          ))}

          {/* Scale labels */}
          <text x={cx - r + 2} y={cy + 12} className="win-prob__scale-label" textAnchor="middle">0</text>
          <text x={cx} y={cy - r + 24} className="win-prob__scale-label" textAnchor="middle">50</text>
          <text x={cx + r - 2} y={cy + 12} className="win-prob__scale-label" textAnchor="middle">100</text>

          {/* Needle (animated rotation around the hub) */}
          <g
            style={{
              transform: `rotate(${needleDeg}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.65s cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}
          >
            <line
              x1={cx} y1={cy} x2={cx} y2={cy - r + 16}
              stroke={band.color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy - r + 20} r={3} fill={band.color} />
          </g>

          {/* Hub */}
          <circle cx={cx} cy={cy} r={6.5} fill="var(--bz-card-bg)" stroke={band.color} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r={2.2} fill={band.color} />
        </svg>
      </div>

      {/* Readout below the dial — never overlaps the needle */}
      <div className="win-prob__readout">
        <span className="win-prob__pct" style={{ color: band.color }}>{clamped}<small>%</small></span>
        <span className="win-prob__band" style={{ color: band.color, borderColor: `color-mix(in srgb, ${band.color} 40%, transparent)`, background: `color-mix(in srgb, ${band.color} 10%, transparent)` }}>
          {band.label}
        </span>
      </div>
    </div>
  )
}
