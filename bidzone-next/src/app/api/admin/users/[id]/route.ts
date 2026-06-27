import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { isProtectedAdmin, requireAdmin, toAdminUserSummary } from '@/lib/admin'
import { UserModel } from '@/models/User'
import { NotificationModel } from '@/models/Notification'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as {
      kycStatus?: string
      listingAllowed?: boolean
      fraudCheckPassed?: boolean
      phoneVerified?: boolean
      role?: string
      kycNotes?: string
    }

    await connectToDatabase()

    const user = await UserModel.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (isProtectedAdmin(user)) {
      return NextResponse.json({ error: 'Cannot modify protected admin accounts' }, { status: 403 })
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Use the Admins section to manage administrators' }, { status: 403 })
    }

    if (admin.userId === id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}

    if (body.kycStatus && ['not_required', 'pending', 'verified', 'rejected'].includes(body.kycStatus)) {
      updates.kycStatus = body.kycStatus
    }
    if (typeof body.listingAllowed === 'boolean') updates.listingAllowed = body.listingAllowed
    if (typeof body.fraudCheckPassed === 'boolean') updates.fraudCheckPassed = body.fraudCheckPassed
    if (typeof body.phoneVerified === 'boolean') updates.phoneVerified = body.phoneVerified
    if (typeof body.kycNotes === 'string') updates.kycNotes = body.kycNotes.trim()

    if (body.role === 'bidder' || body.role === 'seller') {
      updates.role = body.role
    }

    if (updates.kycStatus === 'verified') {
      updates.listingAllowed = true
      updates.fraudCheckPassed = true
      updates.phoneVerified = true
      if (user.role === 'bidder') updates.role = 'seller'
    }

    if (updates.kycStatus === 'rejected') {
      updates.listingAllowed = false
      updates.fraudCheckPassed = false
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    /* Send seller notification on KYC decision */
    if (updates.kycStatus === 'verified') {
      await NotificationModel.create({
        userId: id,
        kind: 'seller_approved',
        read: false,
        meta: {
          message: 'Congratulations! Your seller application has been approved. You can now list items on the marketplace.',
          adminNote: body.kycNotes ?? '',
        },
      })
    } else if (updates.kycStatus === 'rejected') {
      await NotificationModel.create({
        userId: id,
        kind: 'seller_rejected',
        read: false,
        meta: {
          message: 'Your seller application was not approved at this time. Please review the feedback and reapply.',
          adminNote: body.kycNotes ?? '',
        },
      })
    }

    return NextResponse.json({ user: toAdminUserSummary(updated) })
  } catch (err) {
    console.error('[/api/admin/users/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
