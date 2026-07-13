import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase, isDbConnectionError } from '@/lib/mongodb'
import { UserModel } from '@/models/User'
import { buildAuthResponse } from '@/lib/authResponse'
import { checkAccountRestriction } from '@/lib/accountStatus'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const { email, password } = body

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    await connectToDatabase()

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }

    const restriction = await checkAccountRestriction(user)
    if (restriction) {
      return NextResponse.json({ error: restriction.reason, ...restriction }, { status: 403 })
    }

    return NextResponse.json(await buildAuthResponse(user))
  } catch (err) {
    console.error('[/api/auth/login]', err)
    if (isDbConnectionError(err)) {
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
