import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectToDatabase } from '@/lib/mongodb'
import { AuctionModel } from '@/models/Auction'
import { BidModel } from '@/models/Bid'
import { requireAuth } from '@/lib/auth'
import { UserModel } from '@/models/User'
import { CoinTransactionModel } from '@/models/Coin'

function txRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await connectToDatabase()

    const bids = await BidModel.find({ auctionId: id })
      .sort({ placedAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({
      bids: bids.map((b) => ({
        id: b._id.toString(),
        user: b.userName,
        time: new Date(b.placedAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        amount: b.amount,
      })),
    })
  } catch (err) {
    console.error('[/api/auctions/[id]/bids GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await req.json()) as { amount?: number; minBid?: number }

    if (body.amount == null || !Number.isFinite(body.amount)) {
      return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 })
    }

    await connectToDatabase()

    const auction = await AuctionModel.findById(id)
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (auction.moderationStatus !== 'approved') {
      return NextResponse.json({ error: 'Auction not available for bidding' }, { status: 403 })
    }

    if (auction.auctionEndsAt && new Date() > auction.auctionEndsAt) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    const minRequired = body.minBid ?? auction.currentBid + 1
    if (body.amount < minRequired) {
      return NextResponse.json(
        { error: `Bid must be at least $${minRequired}` },
        { status: 400 },
      )
    }

    const bidder = await UserModel.findById(claims.userId)
    if (!bidder) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    const userName = bidder.fullName ?? 'Bidder'

    /* ═══ BIDZONE CURRENCY (BC) ESCROW ═══
       1 bid dollar = 1 BC. The full bid amount is held from the bidder's
       wallet while they lead. When outbid, the previous leader's hold is
       released back automatically. */

    /* Current leader (previous highest bid) */
    const prevTopBid = await BidModel.findOne({ auctionId: id }).sort({ amount: -1, placedAt: -1 })

    /* If the same user is raising their own bid, only the difference is held */
    const alreadyHeld = prevTopBid && prevTopBid.userId === claims.userId ? prevTopBid.amount : 0
    const holdNeeded = body.amount - alreadyHeld

    let bidderBalance = bidder.bcBalance ?? 0

    if (holdNeeded > 0) {
      /* Atomic conditional debit — fails when balance is insufficient (no race) */
      const debited = await UserModel.findOneAndUpdate(
        { _id: claims.userId, bcBalance: { $gte: holdNeeded } },
        { $inc: { bcBalance: -holdNeeded } },
        { returnDocument: 'after', select: 'bcBalance' },
      )
      if (!debited) {
        return NextResponse.json(
          {
            error: `Insufficient BidZone Currency. You need ${holdNeeded.toLocaleString()} BC to place this bid — top up in the Coin Store.`,
            code: 'INSUFFICIENT_BC',
            required: holdNeeded,
            balance: bidder.bcBalance ?? 0,
          },
          { status: 402 },
        )
      }

      bidderBalance = debited.bcBalance

      await CoinTransactionModel.create({
        userId: claims.userId,
        type: 'bid_hold',
        bcAmount: -holdNeeded,
        balanceAfter: debited.bcBalance,
        reference: txRef('HOLD'),
        auctionId: id,
        auctionTitle: auction.title,
        status: 'completed',
        note: `Bid hold for $${body.amount.toLocaleString()}`,
      })
    }

    /* Release the outbid previous leader's escrow (different user only) */
    if (prevTopBid && prevTopBid.userId !== claims.userId) {
      const released = await UserModel.findByIdAndUpdate(
        prevTopBid.userId,
        { $inc: { bcBalance: prevTopBid.amount } },
        { returnDocument: 'after', select: 'bcBalance' },
      )
      if (released) {
        await CoinTransactionModel.create({
          userId: prevTopBid.userId,
          type: 'bid_release',
          bcAmount: prevTopBid.amount,
          balanceAfter: released.bcBalance,
          reference: txRef('RLSE'),
          auctionId: id,
          auctionTitle: auction.title,
          status: 'completed',
          note: 'Outbid — escrow released',
        })
      }
    }

    const bid = await BidModel.create({
      auctionId: id,
      userId: claims.userId,
      userName,
      amount: body.amount,
      placedAt: new Date(),
    })

    await AuctionModel.findByIdAndUpdate(id, {
      $set: { currentBid: body.amount },
      $inc: { bids: 1 },
    })

    return NextResponse.json(
      {
        bid: {
          id: bid._id.toString(),
          user: bid.userName,
          time: new Date(bid.placedAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          amount: bid.amount,
        },
        bcBalance: bidderBalance,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/auctions/[id]/bids POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
