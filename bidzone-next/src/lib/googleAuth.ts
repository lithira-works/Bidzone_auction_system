import { getGoogleClientId } from '@/lib/env'

/** Payload fields from a Google Sign-In ID token (JWT). */
export type GoogleIdTokenPayload = {
  email?: string
  email_verified?: boolean
  name?: string
  sub?: string
}

export function parseGoogleIdToken(credential: string): GoogleIdTokenPayload | null {
  try {
    const parts = credential.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as GoogleIdTokenPayload
    if (!payload.email || payload.email_verified === false) return null
    return payload
  } catch {
    return null
  }
}

/** Server-side only — use useGoogleClientId() in client components. */
export function googleOAuthClientId(): string {
  return getGoogleClientId()
}
