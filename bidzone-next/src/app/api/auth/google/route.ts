import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { signToken } from '@/lib/auth'
import { toUserProfile } from '@/lib/userProfile'

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
        role: 'bidder',
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
    } else if (picture && user.avatarUrl !== picture) {
      /* Keep profile picture in sync on each login */
      user.avatarUrl = picture
      await user.save()
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({ token, user: toUserProfile(user) })
  } catch (err) {
    console.error('[/api/auth/google]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
