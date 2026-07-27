import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { toUserProfile } from '@/lib/userProfile'
import { verifyFirebasePhoneToken } from '@/lib/firebase/verifyIdToken'
import { normalizePhoneE164 } from '@/lib/phoneFormat'
import { isFirebaseConfigured } from '@/lib/firebase/config'

/**
 * POST /api/auth/verify-phone
 * Confirms a Firebase Phone Auth ID token and marks the user's phone as verified.
 */
export async function POST(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Phone verification is not configured' }, { status: 503 })
    }

    const body = (await req.json()) as { idToken?: string; phone?: string }
    const { idToken, phone } = body

    if (!idToken?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing idToken or phone' }, { status: 400 })
    }

    const phoneE164 = normalizePhoneE164(phone)
    if (!phoneE164) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const valid = await verifyFirebasePhoneToken(idToken.trim(), phoneE164)
    if (!valid) {
      return NextResponse.json({ error: 'Phone verification failed. Request a new code and try again.' }, { status: 403 })
    }

    await connectToDatabase()

    const updated = await UserModel.findByIdAndUpdate(
      claims.userId,
      { $set: { phone: phoneE164, phoneVerified: true } },
      { returnDocument: 'after', runValidators: true },
    )

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: toUserProfile(updated) })
  } catch (err) {
    console.error('[/api/auth/verify-phone POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
