import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/admin'
import { toAdminAuctionSummary } from '@/lib/auctionMapper'
import { AuctionModel } from '@/models/Auction'
import { BidModel } from '@/models/Bid'
import { NotificationModel } from '@/models/Notification'
import { formatTimeLeftCompact } from '@/lib/auctionTime'
import type { AuctionItem } from '@/data/auctions'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as Partial<AuctionItem> & {
      moderationStatus?: string
      featured?: boolean
      urgent?: boolean
      moderationNote?: string
    }

    await connectToDatabase()

    const auction = await AuctionModel.findById(id)
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (body.moderationStatus && ['pending', 'approved', 'rejected'].includes(body.moderationStatus)) {
      updates.moderationStatus = body.moderationStatus
    }
    if (typeof body.featured === 'boolean') updates.featured = body.featured
    if (typeof body.urgent === 'boolean') updates.urgent = body.urgent

    if (body.title != null) updates.title = body.title.trim()
    if (body.image != null) updates.image = body.image
    if (body.category != null) updates.category = body.category
    if (body.currentBid != null) updates.currentBid = body.currentBid
    if (body.listingDescription !== undefined) updates.listingDescription = body.listingDescription
    if (body.auctionEndsAt != null) {
      updates.auctionEndsAt = new Date(body.auctionEndsAt)
      updates.timeLeft = formatTimeLeftCompact(body.auctionEndsAt)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await AuctionModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })

    /* Send seller notification on moderation decision */
    if (auction.sellerId && updates.moderationStatus === 'approved') {
      await NotificationModel.create({
        userId: auction.sellerId.toString(),
        kind: 'listing_approved',
        read: false,
        meta: {
          listingTitle: auction.title,
          message: `Your listing "${auction.title}" has been approved and is now live on the marketplace.`,
          adminNote: body.moderationNote ?? '',
        },
      })
    } else if (auction.sellerId && updates.moderationStatus === 'rejected') {
      await NotificationModel.create({
        userId: auction.sellerId.toString(),
        kind: 'listing_rejected',
        read: false,
        meta: {
          listingTitle: auction.title,
          message: `Your listing "${auction.title}" was not approved. Please review the feedback below.`,
          adminNote: body.moderationNote ?? '',
        },
      })
    }

    return NextResponse.json({ auction: toAdminAuctionSummary(updated!) })
  } catch (err) {
    console.error('[/api/admin/auctions/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await connectToDatabase()

    const auction = await AuctionModel.findByIdAndDelete(id)
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    await BidModel.deleteMany({ auctionId: id })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/auctions/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
