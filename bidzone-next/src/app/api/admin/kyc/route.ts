import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/admin'
import { UserModel } from '@/models/User'

/**
 * GET /api/admin/kyc?status=pending|verified|rejected
 * Seller verification queue — the ONLY endpoint that exposes KYC document
 * images, and it is hard-gated behind admin auth (JWT + live DB role check).
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const statusParam = req.nextUrl.searchParams.get('status') ?? 'pending'
    if (!['pending', 'verified', 'rejected'].includes(statusParam)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }
    const status = statusParam as 'pending' | 'verified' | 'rejected'

    await connectToDatabase()

    const users = await UserModel.find({
      kycStatus: status,
      role: { $ne: 'admin' },
      /* Only applications that actually submitted documents */
      kycDocType: { $in: ['nic', 'driving_license'] },
    })
      /* kycDoc* fields are select:false on the schema — opt in explicitly */
      .select(
        'role fullName email phone city kycStatus listingAllowed businessName businessType businessDescription ' +
        'kycSubmittedAt kycNotes kycDocType kycReviewedAt kycReviewedBy createdAt ' +
        '+kycDocFront +kycDocBack +kycSelfie',
      )
      .sort({ kycSubmittedAt: 1 }) /* oldest application first — fair queue */
      .limit(50)

    return NextResponse.json({
      applications: users.map((u) => ({
        id: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        phone: u.phone ?? '',
        city: u.city ?? '',
        role: u.role,
        kycStatus: u.kycStatus,
        businessName: u.businessName ?? '',
        businessType: u.businessType ?? '',
        businessDescription: u.businessDescription ?? '',
        kycSubmittedAt: u.kycSubmittedAt ? u.kycSubmittedAt.toISOString() : null,
        kycNotes: u.kycNotes ?? '',
        docType: u.kycDocType,
        docFront: u.kycDocFront ?? '',
        docBack: u.kycDocBack ?? '',
        selfie: u.kycSelfie ?? '',
        reviewedAt: u.kycReviewedAt ? u.kycReviewedAt.toISOString() : null,
        reviewedBy: u.kycReviewedBy ?? '',
        memberSince: u.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('[/api/admin/kyc GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
