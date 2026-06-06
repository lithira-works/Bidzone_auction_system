import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { AuctionModel } from '@/models/Auction'
import { requireAuth } from '@/lib/auth'
import { isActiveAdmin } from '@/lib/admin'
import { toAuctionItem } from '@/lib/auctionMapper'

async function canViewAuction(
  auction: { sellerId?: string | null; moderationStatus: string },
  claims: { userId: string; role: string } | null,
  isAdmin: boolean,
): Promise<boolean> {
  if (auction.moderationStatus === 'approved') return true
  if (!claims) return false
  if (isAdmin) return true
  return auction.sellerId === claims.userId
}

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await connectToDatabase()

    const auction = await AuctionModel.findById(id)
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    const claims = requireAuth(req)
    let isAdmin = false
    if (claims) {
      const { UserModel } = await import('@/models/User')
      const user = await UserModel.findById(claims.userId)
      isAdmin = user ? isActiveAdmin(user) : false
    }

    if (!(await canViewAuction(auction, claims, isAdmin))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ auction: toAuctionItem(auction) })
  } catch (err) {
    console.error('[/api/auctions/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await req.json()) as Partial<import('@/data/auctions').AuctionItem>

    await connectToDatabase()

    const existing = await AuctionModel.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (existing.sellerId !== claims.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (body.title != null) updates.title = body.title.trim()
    if (body.image != null) updates.image = body.image
    if (body.images !== undefined) updates.images = body.images?.length ? body.images : undefined
    if (body.category != null) updates.category = body.category
    if (body.currentBid != null) updates.currentBid = body.currentBid
    if (body.buyNow !== undefined) updates.buyNow = body.buyNow
    if (body.reservePrice !== undefined) updates.reservePrice = body.reservePrice
    if (body.sellerName != null) updates.sellerName = body.sellerName
    if (body.listingDescription !== undefined) updates.listingDescription = body.listingDescription
    if (body.condition != null) updates.condition = body.condition
    if (body.auctionEndsAt != null) {
      updates.auctionEndsAt = new Date(body.auctionEndsAt)
      const { formatTimeLeftCompact } = await import('@/lib/auctionTime')
      updates.timeLeft = formatTimeLeftCompact(body.auctionEndsAt)
    }

    /* Re-submit for admin review after seller edits */
    if (existing.moderationStatus === 'approved') {
      updates.moderationStatus = 'pending'
    }

    const updated = await AuctionModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    )

    return NextResponse.json({
      auction: toAuctionItem(updated!),
      pendingApproval: updated!.moderationStatus === 'pending',
    })
  } catch (err) {
    console.error('[/api/auctions/[id] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const existing = await AuctionModel.findById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (existing.sellerId !== claims.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await AuctionModel.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/auctions/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
