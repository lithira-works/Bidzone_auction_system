import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin, toAdminUserSummary } from '@/lib/admin'
import { UserModel } from '@/models/User'
import { NotificationModel } from '@/models/Notification'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const kycStatus = searchParams.get('kycStatus')
    const q = searchParams.get('q')?.trim().toLowerCase()

    const filter: Record<string, unknown> = {}
    if (role && ['bidder', 'seller', 'admin'].includes(role)) {
      filter.role = role
    }
    if (kycStatus && ['not_required', 'pending', 'verified', 'rejected'].includes(kycStatus)) {
      filter.kycStatus = kycStatus
    }
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ]
    }

    await connectToDatabase()

    const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(200)

    return NextResponse.json({ users: users.map(toAdminUserSummary) })
  } catch (err) {
    console.error('[/api/admin/users GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as {
      fullName?: string
      email?: string
      password?: string
      phone?: string
      city?: string
      address?: string
      businessName?: string
      businessType?: string
      businessDescription?: string
      /** If true, approve the seller immediately (default: true for admin-created accounts) */
      preApproved?: boolean
    }

    const { fullName, email, password, phone, city, address, businessName, businessType, businessDescription } = body
    const preApproved = body.preApproved !== false // default true

    if (!fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'fullName, email and password are required' }, { status: 400 })
    }

    const allowedBizTypes = ['individual', 'registered_business', 'cooperative', ''] as const
    type BizType = '' | 'individual' | 'registered_business' | 'cooperative'
    const bType: BizType = (typeof businessType === 'string' && (allowedBizTypes as readonly string[]).includes(businessType))
      ? businessType as BizType
      : ''

    await connectToDatabase()

    const normalEmail = email.toLowerCase().trim()
    const existing = await UserModel.findOne({ email: normalEmail })
    if (existing) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (UserModel.create as any)({
      role: 'seller',
      fullName: fullName.trim(),
      email: normalEmail,
      passwordHash,
      phone: phone?.trim() ?? '',
      city: city?.trim() ?? '',
      address: address?.trim() ?? '',
      businessName: businessName?.trim() ?? '',
      businessType: bType,
      businessDescription: businessDescription?.trim() ?? '',
      phoneVerified: preApproved,
      kycStatus: preApproved ? 'verified' : 'pending',
      listingAllowed: preApproved,
      fraudCheckPassed: preApproved,
      kycSubmittedAt: new Date(),
      kycNotes: preApproved ? 'Account created directly by admin.' : '',
    }) as import('@/models/User').IUser & { _id: import('mongoose').Types.ObjectId }

    if (preApproved) {
      await NotificationModel.create({
        userId: user._id.toString(),
        kind: 'seller_approved',
        read: false,
        meta: {
          message: 'Welcome to BidZone! Your seller account has been created and approved by an admin. You can start listing items now.',
          adminNote: 'Account created by admin.',
        },
      })
    }

    return NextResponse.json({ user: toAdminUserSummary(user) }, { status: 201 })
  } catch (err) {
    console.error('[/api/admin/users POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
