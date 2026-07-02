import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { BidModel } from '@/models/Bid'
import { AuctionModel } from '@/models/Auction'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    /* All bids the user has placed, newest first */
    const bids = await BidModel.find({ userId: claims.userId })
      .sort({ placedAt: -1 })
      .lean()

    if (bids.length === 0) {
      return NextResponse.json({ bids: [], stats: { totalBids: 0, activeBids: 0, wonAuctions: 0, totalSpent: 0 } })
    }

    /* Unique auction IDs the user bid on */
    const auctionIds = [...new Set(bids.map((b) => b.auctionId))]

    const auctions = await AuctionModel.find({ _id: { $in: auctionIds } }).lean()
    const auctionMap = new Map(auctions.map((a) => [a._id.toString(), a]))

    const now = new Date()

    /* Build per-auction summary: user's highest bid + auction snapshot */
    const seenAuctions = new Set<string>()
    const bidRows: object[] = []

    for (const bid of bids) {
      const aid = bid.auctionId
      if (seenAuctions.has(aid)) continue
      seenAuctions.add(aid)

      const auction = auctionMap.get(aid)
      if (!auction) continue

      const ended = auction.auctionEndsAt ? new Date(auction.auctionEndsAt) < now : false
      const isWinner = ended && String(auction.currentBid) === String(bid.amount) && bid.amount === auction.currentBid

      /* User's highest bid on this auction */
      const userBids = bids.filter((b) => b.auctionId === aid)
      const highestUserBid = Math.max(...userBids.map((b) => b.amount))

      bidRows.push({
        auctionId: aid,
        auctionTitle: auction.title,
        auctionImage: auction.image ?? '',
        auctionCategory: auction.category ?? '',
        currentBid: auction.currentBid,
        myHighestBid: highestUserBid,
        myBidCount: userBids.length,
        auctionEndsAt: auction.auctionEndsAt?.toISOString() ?? null,
        moderationStatus: auction.moderationStatus,
        ended,
        isWinner,
        isLeading: !ended && auction.currentBid === highestUserBid,
        isOutbid: !ended && auction.currentBid > highestUserBid,
        lastBidAt: bid.placedAt.toISOString(),
      })
    }

    const activeBids = bidRows.filter((r: any) => !r.ended).length
    const wonAuctions = bidRows.filter((r: any) => r.isWinner).length
    const totalSpent = bidRows
      .filter((r: any) => r.isWinner)
      .reduce((acc: number, r: any) => acc + (r.myHighestBid as number), 0)

    return NextResponse.json({
      bids: bidRows,
      stats: {
        totalBids: bids.length,
        activeBids,
        wonAuctions,
        totalSpent,
      },
    })
  } catch (err) {
    console.error('[/api/buyer/bids GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
