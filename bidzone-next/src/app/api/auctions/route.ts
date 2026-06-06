import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { AuctionModel } from '@/models/Auction'
import { UserModel } from '@/models/User'
import { requireAuth } from '@/lib/auth'
import { isActiveAdmin } from '@/lib/admin'
import { toAuctionItem } from '@/lib/auctionMapper'
import { formatTimeLeftCompact } from '@/lib/auctionTime'
import type { AuctionItem } from '@/data/auctions'

type CreateBody = Partial<AuctionItem>

function parseImages(body: Partial<AuctionItem>): string[] | undefined {
  const raw = body.images?.filter((u) => typeof u === 'string' && u.trim()) ?? []
  if (raw.length > 0) return raw.slice(0, 8)
  if (body.image) return [body.image]
  return undefined
}

function parseCreateBody(body: CreateBody) {
  if (!body.title?.trim() || !body.image || !body.category || body.currentBid == null) {
    return null
  }
  const images = parseImages(body)
  return {
    title: body.title.trim(),
    image: body.image,
    images,
    category: body.category,
    currentBid: body.currentBid,
    buyNow: body.buyNow,
    reservePrice: body.reservePrice,
    bids: body.bids ?? 0,
    urgent: body.urgent ?? false,
    featured: body.featured ?? false,
    sellerName: body.sellerName?.trim(),
    listingDescription: body.listingDescription,
    condition: body.condition,
    auctionEndsAt: body.auctionEndsAt ? new Date(body.auctionEndsAt) : undefined,
    timeLeft: body.auctionEndsAt ? formatTimeLeftCompact(body.auctionEndsAt) : '',
  }
}

/** Public marketplace — approved listings only */
export async function GET() {
  try {
    await connectToDatabase()
    const auctions = await AuctionModel.find({ moderationStatus: 'approved' }).sort({
      auctionCreatedAt: -1,
    })
    return NextResponse.json({ auctions: auctions.map(toAuctionItem) })
  } catch (err) {
    console.error('[/api/auctions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Sellers create pending listings */
export async function POST(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as CreateBody
    const parsed = parseCreateBody(body)
    if (!parsed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(claims.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (isActiveAdmin(user)) {
      return NextResponse.json(
        { error: 'Admins should create listings from the admin console' },
        { status: 403 },
      )
    }

    if (user.role !== 'seller' || !user.listingAllowed || !user.phoneVerified) {
      return NextResponse.json({ error: 'Seller listing not permitted' }, { status: 403 })
    }

    const auction = await AuctionModel.create({
      ...parsed,
      sellerId: claims.userId,
      sellerName: parsed.sellerName || user.fullName,
      auctionCreatedAt: new Date(),
      moderationStatus: 'pending',
      listingSource: 'seller',
    })

    return NextResponse.json(
      { auction: toAuctionItem(auction), pendingApproval: true },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/auctions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
