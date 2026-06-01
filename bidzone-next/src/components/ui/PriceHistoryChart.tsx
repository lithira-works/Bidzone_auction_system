'use client'
import type { PriceHistoryPoint } from '@/data/auctionDetails'

type Props = { points: PriceHistoryPoint[] }

export function PriceHistoryChart({ points }: Props) {
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const pad = (maxV - minV) * 0.12 || maxV * 0.08 || 1
  const yMin = Math.max(0, minV - pad)
  const yMax = maxV + pad

  const w = 560
  const h = 200
  const padL = 48
  const padR = 16
  const padT = 16
  const padB = 36

  const innerW = w - padL - padR
  const innerH = h - padT - padB

  const toX = (i: number) => padL + (i / (points.length - 1)) * innerW
  const toY = (v: number) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH

  const lineD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`)
    .join(' ')

  const yTicks = 5
  const tickVals = Array.from({ length: yTicks }, (_, i) => yMin + ((yMax - yMin) * i) / (yTicks - 1))

  return (
    <div className="price-chart">
      <svg className="price-chart__svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {tickVals.map((v, i) => {
          const y = toY(v)
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} className="price-chart__grid" />
              <text x={4} y={y + 4} className="price-chart__axis-label">
                {Math.round(v).toLocaleString()}
              </text>
            </g>
          )
        })}
        <path d={lineD} className="price-chart__line" fill="none" />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={toX(i)} cy={toY(p.value)} r={5} className="price-chart__dot" />
            <text x={toX(i)} y={h - 8} textAnchor="middle" className="price-chart__x-label">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
