import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { isProtectedAdmin, requireAdmin, toAdminUserSummary } from '@/lib/admin'
import { UserModel } from '@/models/User'
import { NotificationModel, type NotificationKind } from '@/models/Notification'

type RouteParams = { params: Promise<{ id: string }> }

const MAX_SUSPEND_DAYS = 365

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
      /* ── Moderation actions ── */
      accountStatus?: 'active' | 'banned' | 'suspended'
      suspendedUntil?: string
      statusReason?: string
      biddingBlocked?: boolean
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
    const wasSeller = user.role === 'seller'
    let notifyKind: NotificationKind | null = null
    let notifyMessage = ''

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

    /* Audit trail: record who reviewed the application and when */
    if (updates.kycStatus === 'verified' || updates.kycStatus === 'rejected') {
      updates.kycReviewedAt = new Date()
      updates.kycReviewedBy = admin.email
    }

    /* ── Remove seller role: demote seller → bidder and revoke listing privileges ── */
    if (body.role === 'bidder' && wasSeller) {
      updates.listingAllowed = false
      updates.fraudCheckPassed = false
      updates.kycStatus = 'not_required'
      updates.kycNotes = ''
      notifyKind = 'seller_role_removed'
      notifyMessage =
        (body.statusReason?.trim() ||
          'Your seller privileges have been removed by an administrator. You can still browse and bid as a buyer.')
    }

    /* ── Bidding / buyer-privilege toggle (independent of ban/suspend) ── */
    if (typeof body.biddingBlocked === 'boolean' && body.biddingBlocked !== user.biddingBlocked) {
      updates.biddingBlocked = body.biddingBlocked
      if (body.biddingBlocked) {
        notifyKind = 'bidding_blocked'
        notifyMessage =
          body.statusReason?.trim() ||
          'Your buyer privileges (bidding & coin purchases) have been restricted by an administrator.'
      } else {
        notifyKind = 'bidding_restored'
        notifyMessage = 'Your buyer privileges have been restored. You can bid and purchase BC again.'
      }
    }

    /* ── Ban / suspend / reinstate ── */
    if (body.accountStatus === 'banned') {
      if (!body.statusReason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to ban a user.' }, { status: 400 })
      }
      updates.accountStatus = 'banned'
      updates.suspendedUntil = null
      updates.statusReason = body.statusReason.trim()
      updates.statusUpdatedAt = new Date()
      updates.statusUpdatedBy = admin.email
      notifyKind = 'account_banned'
      notifyMessage = updates.statusReason as string
    } else if (body.accountStatus === 'suspended') {
      if (!body.statusReason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to suspend a user.' }, { status: 400 })
      }
      const until = body.suspendedUntil ? new Date(body.suspendedUntil) : null
      if (!until || Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'A valid future suspension end date is required.' }, { status: 400 })
      }
      const maxUntil = Date.now() + MAX_SUSPEND_DAYS * 24 * 60 * 60 * 1000
      if (until.getTime() > maxUntil) {
        return NextResponse.json({ error: `Suspension cannot exceed ${MAX_SUSPEND_DAYS} days.` }, { status: 400 })
      }
      updates.accountStatus = 'suspended'
      updates.suspendedUntil = until
      updates.statusReason = body.statusReason.trim()
      updates.statusUpdatedAt = new Date()
      updates.statusUpdatedBy = admin.email
      notifyKind = 'account_suspended'
      notifyMessage = `${updates.statusReason} (Suspended until ${until.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })})`
    } else if (body.accountStatus === 'active' && user.accountStatus !== 'active') {
      updates.accountStatus = 'active'
      updates.suspendedUntil = null
      updates.statusReason = ''
      updates.statusUpdatedAt = new Date()
      updates.statusUpdatedBy = admin.email
      notifyKind = 'account_reinstated'
      notifyMessage = 'Your account has been reinstated. Welcome back to BidZone!'
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after', runValidators: true })

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

    /* Moderation-action notification (ban/suspend/reinstate/role/bidding) */
    if (notifyKind) {
      await NotificationModel.create({
        userId: id,
        kind: notifyKind,
        read: false,
        meta: { message: notifyMessage },
      })
    }

    return NextResponse.json({ user: toAdminUserSummary(updated) })
  } catch (err) {
    console.error('[/api/admin/users/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
