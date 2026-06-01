/** Demo heuristic standing in for an ML win-probability model (Phase 3 flowchart). */

export function estimateWinProbability(params: {
  yourBid: number
  minBid: number
  /** Seconds remaining; urgency nudges probability up when time is short */
  urgencySec: number
}): number {
  if (params.yourBid < params.minBid) return 12
  const headroom = (params.yourBid - params.minBid) / Math.max(params.minBid, 1)
  let p = 36 + Math.min(40, headroom * 30)
  if (params.urgencySec < 3600) p += 7
  if (params.urgencySec < 600) p += 8
  if (params.urgencySec < 120) p += 5
  return Math.round(Math.min(94, Math.max(16, p)))
}

/** Tiny sparkline series for UI (deterministic from listing id). */
export function demoSparklinePoints(seed: string, n = 8): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const out: number[] = []
  let v = 42 + (Math.abs(h) % 28)
  for (let i = 0; i < n; i++) {
    v += ((h >> (i * 3)) % 7) - 2
    out.push(Math.max(8, Math.min(96, v)))
  }
  return out
}
