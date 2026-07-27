/**
 * Server-side Firebase ID token verification via Identity Toolkit REST API.
 * Uses the web API key — no service-account JSON required for phone OTP checks.
 */
import { normalizePhoneE164 } from '@/lib/phoneFormat'

export type FirebaseTokenInfo = {
  uid: string
  phoneNumber: string | null
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenInfo | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()
  if (!apiKey || !idToken.trim()) return null

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken.trim() }),
        cache: 'no-store',
      },
    )

    if (!res.ok) return null

    const data = (await res.json()) as {
      users?: Array<{ localId?: string; phoneNumber?: string }>
    }
    const user = data.users?.[0]
    if (!user?.localId) return null

    return {
      uid: user.localId,
      phoneNumber: user.phoneNumber ?? null,
    }
  } catch {
    return null
  }
}

/** Returns true when the Firebase token's phone matches the expected number. */
export async function verifyFirebasePhoneToken(
  idToken: string,
  expectedPhone: string,
): Promise<boolean> {
  const info = await verifyFirebaseIdToken(idToken)
  if (!info?.phoneNumber) return false

  const tokenPhone = normalizePhoneE164(info.phoneNumber)
  const expected = normalizePhoneE164(expectedPhone)
  return tokenPhone !== null && expected !== null && tokenPhone === expected
}
