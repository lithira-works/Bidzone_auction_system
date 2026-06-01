/** Deterministic “agentic” copy for the demo (not a live LLM). */

export function bidCoachAmounts(currentHigh: number, minBid: number): { refHigh: number; suggest: number } {
  const refHigh = Math.round(currentHigh * 1.07 + minBid * 0.015)
  const suggest = Math.round(minBid + Math.max(1, currentHigh * 0.025))
  return { refHigh, suggest }
}
