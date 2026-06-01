'use client'
import { useId, useMemo } from 'react'
import { demoSparklinePoints } from '@/lib/winProbability'

type Props = { percent: number; seed: string }

export function WinProbabilityGauge({ percent, seed }: Props) {
  const gradId = useId().replace(/:/g, '')
  const pts = useMemo(() => demoSparklinePoints(seed), [seed])
  const w = 200
  const h = 56
  const pad = 4
  const max = Math.max(...pts, 1)
  const min = Math.min(...pts, 0)
  const span = max - min || 1
  const pathD = pts
    .map((v, i) => {
      const x = pad + (i / (pts.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / span) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const clamped = Math.min(100, Math.max(0, percent))
  const angle = (clamped / 100) * 180
  const rad = ((180 - angle) * Math.PI) / 180
  const cx = 70
  const cy = 70
  const r = 52
  const nx = cx + r * Math.cos(rad)
  const ny = cy - r * Math.sin(rad)

  return (
    <div className="win-prob">
      <div className="win-prob__gauge-wrap" aria-hidden>
        <svg className="win-prob__gauge" viewBox="0 0 140 80" width={160} height={92}>
          <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke="var(--bz-card-border)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 18 70 A 52 52 0 0 1 122 70"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * 164} 200`}
          />
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--bz-text)" strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={5} fill="var(--bz-text)" />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--bz-gold)" />
              <stop offset="100%" stopColor="var(--bz-success)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="win-prob__pct">{clamped}%</span>
      </div>
      <svg className="win-prob__spark" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
        <path d={pathD} fill="none" stroke="var(--bz-info)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}
