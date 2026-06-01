/** Helpers for seller-set auction end times (ISO 8601). */

export function secondsUntil(isoEnd: string, now = new Date()): number {
  const endMs = new Date(isoEnd).getTime()
  if (!Number.isFinite(endMs)) return 0
  return Math.max(0, Math.floor((endMs - now.getTime()) / 1000))
}

export function secondsToHmsParts(total: number): { h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(total))
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}

/** Compact label for cards: "2d 5h", "3h 12m", "45m 2s". */
export function formatTimeLeftCompact(isoEnd: string, now = new Date()): string {
  const sec = secondsUntil(isoEnd, now)
  if (sec <= 0) return '—'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parse `datetime-local` value as ISO string in the user's timezone. */
export function fromDatetimeLocalValue(localValue: string): string {
  const d = new Date(localValue)
  return d.toISOString()
}

export function displayAuctionEndLocal(isoEnd: string): string {
  try {
    return new Date(isoEnd).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return isoEnd
  }
}
