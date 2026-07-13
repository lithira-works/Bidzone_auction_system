import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { isProtectedAdmin, requireAdmin } from '@/lib/admin'
import { UserModel } from '@/models/User'
import { NotificationModel } from '@/models/Notification'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/users/[id]/warn
 * Sends a one-time warning notification to a user's profile without
 * changing their account status, role, or privileges.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as { message?: string }
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json({ error: 'A warning message is required.' }, { status: 400 })
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Warning message is too long (max 500 characters).' }, { status: 400 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (isProtectedAdmin(user) || user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot warn administrator accounts' }, { status: 403 })
    }
    if (admin.userId === id) {
      return NextResponse.json({ error: 'Cannot warn your own account' }, { status: 403 })
    }

    await NotificationModel.create({
      userId: id,
      kind: 'admin_warning',
      read: false,
      meta: { message },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/admin/users/[id]/warn POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
