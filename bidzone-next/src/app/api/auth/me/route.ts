import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { requireAuth, signToken } from '@/lib/auth'
import { syncAdminRole } from '@/lib/admin'
import { toUserProfile } from '@/lib/userProfile'

export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const roleBefore = user.role
    await syncAdminRole(user)

    const payload: { user: ReturnType<typeof toUserProfile>; token?: string } = {
      user: toUserProfile(user),
    }

    if (user.role !== roleBefore || user.role !== claims.role) {
      payload.token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      })
    }

    return NextResponse.json(payload)
  } catch (err) {
    console.error('[/api/auth/me GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      role?: string
      phone?: string
      phoneVerified?: boolean
      kycStatus?: string
      listingAllowed?: boolean
      fraudCheckPassed?: boolean
      businessName?: string
      businessType?: string
      businessDescription?: string
      city?: string
      address?: string
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allowed: Record<string, unknown> = {}

    if (typeof body.phone === 'string') allowed.phone = body.phone.trim()
    if (typeof body.city === 'string') allowed.city = body.city.trim()
    if (typeof body.address === 'string') allowed.address = body.address.trim()
    if (typeof body.businessName === 'string') allowed.businessName = body.businessName.trim()
    if (typeof body.businessDescription === 'string') allowed.businessDescription = body.businessDescription.trim()
    const allowedBizTypes = ['individual', 'registered_business', 'cooperative', '']
    if (typeof body.businessType === 'string' && allowedBizTypes.includes(body.businessType)) {
      allowed.businessType = body.businessType
    }

    /* Bidder → seller upgrade only; privileges require admin approval */
    if (body.role === 'seller' && user.role === 'bidder') {
      allowed.role = 'seller'
      allowed.kycStatus = 'pending'
      allowed.phoneVerified = false
      allowed.listingAllowed = false
      allowed.fraudCheckPassed = false
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await UserModel.findByIdAndUpdate(
      claims.userId,
      { $set: allowed },
      { returnDocument: 'after', runValidators: true },
    )

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: toUserProfile(updated) })
  } catch (err) {
    console.error('[/api/auth/me PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
