/**
 * Production API base URL from `NEXT_PUBLIC_API_URL` at build time.
 * Use `apiUrl("/auth/token")` when you wire fetch calls to the backend.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (raw == null || typeof raw !== 'string') return ''
  return raw.trim().replace(/\/$/, '')
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}

/** WebSocket base (http → ws, https → wss). */
export function wsUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    if (typeof window === 'undefined') return p
    const loc = window.location
    const wsProto = loc.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${loc.host}${p}`
  }
  const u = base.startsWith('https://')
    ? `wss://${base.slice('https://'.length)}`
    : base.startsWith('http://')
      ? `ws://${base.slice('http://'.length)}`
      : `wss://${base}`
  return `${u}${p}`
}
