import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase, isDbConnectionError } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { buildAuthResponse } from '@/lib/authResponse'
import { isAdminEmail } from '@/lib/admin'
import { checkAccountRestriction } from '@/lib/accountStatus'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; name?: string; sub?: string; picture?: string }
    const { email, name, sub, picture } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    await connectToDatabase()

    const normalEmail = email.toLowerCase().trim()
    let user = await UserModel.findOne({ email: normalEmail })

    if (!user) {
      const passwordHash = await bcrypt.hash(`google-oauth:${sub ?? crypto.randomUUID()}`, 10)
      const displayName = name?.trim() || normalEmail.split('@')[0] || 'Bidder'

      user = await UserModel.create({
        role: isAdminEmail(normalEmail) ? 'admin' : 'bidder',
        isSuperAdmin: isAdminEmail(normalEmail),
        delegatedAdmin: false,
        fullName: displayName,
        email: normalEmail,
        passwordHash,
        address: '',
        city: '',
        phone: '',
        phoneVerified: false,
        kycStatus: 'not_required',
        listingAllowed: false,
        fraudCheckPassed: false,
        avatarUrl: picture ?? null,
      })
    } else {
      const restriction = await checkAccountRestriction(user)
      if (restriction) {
        return NextResponse.json({ error: restriction.reason, ...restriction }, { status: 403 })
      }
      if (picture && user.avatarUrl !== picture) {
        user.avatarUrl = picture
        await user.save()
      }
    }

    return NextResponse.json(await buildAuthResponse(user))
  } catch (err) {
    console.error('[/api/auth/google]', err)
    if (isDbConnectionError(err)) {
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
