import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { AuctionModel } from '@/models/Auction'
import { BidModel } from '@/models/Bid'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/seller/stats
 * Returns real dashboard statistics for the authenticated seller.
 */
export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const sellerId = claims.userId

    const [
      totalListings,
      approvedListings,
      pendingListings,
      rejectedListings,
    ] = await Promise.all([
      AuctionModel.countDocuments({ sellerId }),
      AuctionModel.countDocuments({ sellerId, moderationStatus: 'approved' }),
      AuctionModel.countDocuments({ sellerId, moderationStatus: 'pending' }),
      AuctionModel.countDocuments({ sellerId, moderationStatus: 'rejected' }),
    ])

    const now = new Date()
    const activeListings = await AuctionModel.countDocuments({
      sellerId,
      moderationStatus: 'approved',
      auctionEndsAt: { $gt: now },
    })

    const endingSoon = await AuctionModel.countDocuments({
      sellerId,
      moderationStatus: 'approved',
      auctionEndsAt: { $gt: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
    })

    const revenueResult = await AuctionModel.aggregate([
      { $match: { sellerId, moderationStatus: 'approved' } },
      { $group: { _id: null, total: { $sum: '$currentBid' }, totalBids: { $sum: '$bids' } } },
    ])

    const totalRevenue: number = revenueResult[0]?.total ?? 0
    const totalBidsReceived: number = revenueResult[0]?.totalBids ?? 0

    const sellerAuctionIds = (await AuctionModel.distinct('_id', { sellerId })).map((id) =>
      id.toString(),
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueBidders = await BidModel.distinct('userId', { auctionId: { $in: sellerAuctionIds } } as any)

    return NextResponse.json({
      totalListings,
      approvedListings,
      pendingListings,
      rejectedListings,
      activeListings,
      endingSoon,
      totalRevenue,
      totalBidsReceived,
      uniqueBidders: uniqueBidders.length,
    })
  } catch (err) {
    console.error('[/api/seller/stats GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
