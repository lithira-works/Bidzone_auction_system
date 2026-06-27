import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { toUserProfile } from '@/lib/userProfile'

/**
 * POST /api/seller/apply
 * Submits a seller application for the authenticated user.
 * Sets role → seller, kycStatus → pending, and saves business profile fields.
 * The account remains in pending state until an admin approves it.
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
    }

    if (!body.businessName?.trim()) {
      return NextResponse.json({ error: 'Business or display name is required' }, { status: 400 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot apply to become sellers' }, { status: 403 })
    }

    if (user.kycStatus === 'verified' && user.listingAllowed) {
      return NextResponse.json({ error: 'Already an approved seller' }, { status: 400 })
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
    }

    if (body.phone?.trim()) {
      updates.phone = body.phone.trim()
    }

    const updated = await UserModel.findByIdAndUpdate(
      claims.userId,
      { $set: updates },
      { new: true, runValidators: true },
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
 */
export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId).select(
      'role kycStatus listingAllowed businessName businessType businessDescription kycSubmittedAt kycNotes',
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
    })
  } catch (err) {
    console.error('[/api/seller/apply GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
