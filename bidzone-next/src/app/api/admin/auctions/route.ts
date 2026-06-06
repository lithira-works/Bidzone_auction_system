import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/admin'
import { toAdminAuctionSummary } from '@/lib/auctionMapper'
import { AuctionModel } from '@/models/Auction'
import { formatTimeLeftCompact } from '@/lib/auctionTime'
import type { AuctionItem } from '@/data/auctions'

function parseImages(body: Partial<AuctionItem>): string[] | undefined {
  const raw = body.images?.filter((u) => typeof u === 'string' && u.trim()) ?? []
  if (raw.length > 0) return raw.slice(0, 8)
  if (body.image) return [body.image]
  return undefined
}

function parseListingBody(body: Partial<AuctionItem>) {
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
    sellerName: body.sellerName?.trim() || 'BidZone Official',
    listingDescription: body.listingDescription,
    condition: body.condition ?? 'New',
    auctionEndsAt: body.auctionEndsAt ? new Date(body.auctionEndsAt) : undefined,
    timeLeft: body.auctionEndsAt ? formatTimeLeftCompact(body.auctionEndsAt) : '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const moderationStatus = searchParams.get('moderationStatus')

    const filter: Record<string, unknown> = {}
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sellerName: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }
    if (moderationStatus && ['pending', 'approved', 'rejected'].includes(moderationStatus)) {
      filter.moderationStatus = moderationStatus
    }

    await connectToDatabase()

    const auctions = await AuctionModel.find(filter).sort({ auctionCreatedAt: -1 }).limit(200)

    return NextResponse.json({ auctions: auctions.map(toAdminAuctionSummary) })
  } catch (err) {
    console.error('[/api/admin/auctions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Admin-created listings go live immediately */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as Partial<AuctionItem>
    const parsed = parseListingBody(body)
    if (!parsed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!body.auctionEndsAt) {
      return NextResponse.json({ error: 'Auction end date is required' }, { status: 400 })
    }

    await connectToDatabase()

    const auction = await AuctionModel.create({
      ...parsed,
      sellerId: admin.userId,
      auctionCreatedAt: new Date(),
      moderationStatus: 'approved',
      listingSource: 'admin',
    })

    return NextResponse.json({ auction: toAdminAuctionSummary(auction) }, { status: 201 })
  } catch (err) {
    console.error('[/api/admin/auctions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
