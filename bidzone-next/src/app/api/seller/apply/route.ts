import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { toUserProfile } from '@/lib/userProfile'
import { checkAccountRestriction } from '@/lib/accountStatus'

/* ── KYC document validation ──
   Images arrive as base64 data URLs. Enforce an allowlisted mime type and a
   hard size cap server-side so oversized/forged payloads are rejected even
   if the client is bypassed. */
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 6 * 1024 * 1024 /* 6 MB per document */

function validateKycImage(value: unknown, label: string): string | null {
  if (typeof value !== 'string' || !value.startsWith('data:')) {
    return `${label} is missing or invalid`
  }
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,/.exec(value)
  if (!match || !ALLOWED_MIME.includes(match[1].toLowerCase())) {
    return `${label} must be a JPG, PNG or WEBP image`
  }
  /* base64 expands bytes by ~4/3 — reverse to estimate the raw size */
  const b64Len = value.length - match[0].length
  const approxBytes = Math.floor(b64Len * 0.75)
  if (approxBytes > MAX_IMAGE_BYTES) {
    return `${label} exceeds the 6 MB size limit`
  }
  if (approxBytes < 1024) {
    return `${label} appears to be empty or corrupted`
  }
  return null
}

/**
 * POST /api/seller/apply
 * Submits a seller application for the authenticated user.
 * Requires identity documents: ID front, ID back and a selfie.
 * Sets role → seller, kycStatus → pending. The account remains pending
 * (no listing access) until an admin reviews the documents and approves.
 */
export async function POST(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      phone?: string
      businessName?: string
      businessType?: string
      businessDescription?: string
      docType?: string
      docFront?: string
      docBack?: string
      selfie?: string
    }

    if (!body.businessName?.trim()) {
      return NextResponse.json({ error: 'Business or display name is required' }, { status: 400 })
    }

    /* ── Identity documents are mandatory ── */
    if (body.docType !== 'nic' && body.docType !== 'driving_license') {
      return NextResponse.json({ error: 'Select NIC or Driving License as your identity document' }, { status: 400 })
    }
    for (const [value, label] of [
      [body.docFront, 'Document front image'],
      [body.docBack, 'Document back image'],
      [body.selfie, 'Selfie photo'],
    ] as const) {
      const err = validateKycImage(value, label)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot apply to become sellers' }, { status: 403 })
    }

    const restriction = await checkAccountRestriction(user)
    if (restriction) {
      return NextResponse.json({ error: restriction.reason }, { status: 403 })
    }

    if (user.kycStatus === 'verified' && user.listingAllowed) {
      return NextResponse.json({ error: 'Already an approved seller' }, { status: 400 })
    }

    if (user.kycStatus === 'pending' && user.kycSubmittedAt) {
      return NextResponse.json({ error: 'Your application is already under review' }, { status: 409 })
    }

    const allowedTypes = ['individual', 'registered_business', 'cooperative', '']
    const businessType = allowedTypes.includes(body.businessType ?? '')
      ? (body.businessType ?? 'individual')
      : 'individual'

    const updates: Record<string, unknown> = {
      role: 'seller',
      kycStatus: 'pending',
      listingAllowed: false,
      fraudCheckPassed: false,
      phoneVerified: false,
      businessName: body.businessName.trim(),
      businessType,
      businessDescription: (body.businessDescription ?? '').trim(),
      kycSubmittedAt: new Date(),
      kycNotes: '',
      kycDocType: body.docType,
      kycDocFront: body.docFront,
      kycDocBack: body.docBack,
      kycSelfie: body.selfie,
      kycReviewedAt: null,
      kycReviewedBy: '',
    }

    if (body.phone?.trim()) {
      updates.phone = body.phone.trim()
    }

    const updated = await UserModel.findByIdAndUpdate(
      claims.userId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    )

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: toUserProfile(updated) })
  } catch (err) {
    console.error('[/api/seller/apply POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/seller/apply
 * Returns the current application status for the authenticated user.
 * Document images are never returned here — status flags only.
 */
export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId).select(
      'role kycStatus listingAllowed businessName businessType businessDescription kycSubmittedAt kycNotes kycDocType',
    )
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: user.kycStatus,
      role: user.role,
      listingAllowed: user.listingAllowed,
      businessName: user.businessName ?? '',
      businessType: user.businessType ?? '',
      businessDescription: user.businessDescription ?? '',
      kycSubmittedAt: user.kycSubmittedAt ? user.kycSubmittedAt.toISOString() : null,
      kycNotes: user.kycNotes ?? '',
      docType: user.kycDocType ?? '',
      documentsSubmitted: Boolean(user.kycDocType),
    })
  } catch (err) {
    console.error('[/api/seller/apply GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
