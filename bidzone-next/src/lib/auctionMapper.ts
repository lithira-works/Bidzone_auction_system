import type { IAuction } from '@/models/Auction'
import type { AuctionItem } from '@/data/auctions'
import { formatTimeLeftCompact } from '@/lib/auctionTime'

export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export function toAuctionItem(doc: IAuction): AuctionItem {
  const endsIso = doc.auctionEndsAt?.toISOString()
  return {
    id: doc._id.toString(),
    title: doc.title,
    image: doc.image,
    images: doc.images?.length ? doc.images : undefined,
    category: doc.category,
    currentBid: doc.currentBid,
    buyNow: doc.buyNow,
    reservePrice: doc.reservePrice,
    bids: doc.bids,
    timeLeft: endsIso ? formatTimeLeftCompact(endsIso) : doc.timeLeft,
    urgent: doc.urgent,
    featured: doc.featured,
    sellerName: doc.sellerName,
    listingDescription: doc.listingDescription,
    condition: doc.condition,
    auctionEndsAt: endsIso,
    auctionCreatedAt: doc.auctionCreatedAt?.toISOString(),
    moderationStatus: doc.moderationStatus,
    listingSource: doc.listingSource,
  }
}

export function toAdminAuctionSummary(doc: IAuction) {
  const item = toAuctionItem(doc)
  return {
    ...item,
    sellerId: doc.sellerId,
  }
}
