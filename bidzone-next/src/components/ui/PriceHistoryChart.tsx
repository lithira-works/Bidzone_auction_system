'use client'
import { useId } from 'react'
import type { PriceHistoryPoint } from '@/data/auctionDetails'

type Props = { points: PriceHistoryPoint[] }

/** Max x-axis labels before we start skipping to avoid crowding. */
const MAX_X_LABELS = 6
/** Hide the per-point dots once the series gets dense. */
const MAX_DOTS = 20

export function PriceHistoryChart({ points }: Props) {
  const fillId = useId().replace(/:/g, '')
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const pad = (maxV - minV) * 0.12 || maxV * 0.08 || 1
  const yMin = Math.max(0, minV - pad)
  const yMax = maxV + pad

  const w = 560
  const h = 210
  const padL = 48
  const padR = 16
  const padT = 16
  const padB = 34

  const innerW = w - padL - padR
  const innerH = h - padT - padB

  const toX = (i: number) => padL + (i / (points.length - 1)) * innerW
  const toY = (v: number) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH

  const lineD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`)
    .join(' ')

  const areaD = `${lineD} L ${toX(points.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${padL} ${(padT + innerH).toFixed(1)} Z`

  const yTicks = 5
  const tickVals = Array.from({ length: yTicks }, (_, i) => yMin + ((yMax - yMin) * i) / (yTicks - 1))

  /* Skip x labels when the series is dense so they never overlap */
  const labelEvery = Math.max(1, Math.ceil(points.length / MAX_X_LABELS))
  const showDots = points.length <= MAX_DOTS
  const lastIdx = points.length - 1

  return (
    <div className="price-chart">
      <svg className="price-chart__svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bz-gold)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--bz-gold)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

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

        <path d={areaD} fill={`url(#${fillId})`} stroke="none" />
        <path d={lineD} className="price-chart__line" fill="none" />

        {points.map((p, i) => {
          const showLabel = i % labelEvery === 0 || i === lastIdx
          return (
            <g key={`${p.label}-${i}`}>
              {(showDots || i === lastIdx) && (
                <circle
                  cx={toX(i)}
                  cy={toY(p.value)}
                  r={i === lastIdx ? 5 : 4}
                  className={i === lastIdx ? 'price-chart__dot price-chart__dot--last' : 'price-chart__dot'}
                />
              )}
              {showLabel && (
                <text x={toX(i)} y={h - 8} textAnchor="middle" className="price-chart__x-label">
                  {p.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
