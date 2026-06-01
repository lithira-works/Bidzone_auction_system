import { type AuctionItem } from './auctions'
import { getAuctionRecord } from '../lib/auctionRecords'
import { getLiveBidState } from '../lib/liveAuctionBids'
import { secondsToHmsParts, secondsUntil } from '../lib/auctionTime'

export type BidHistoryEntry = {
  id: string
  user: string
  time: string
  amount: number
}

export type PriceHistoryPoint = {
  label: string
  value: number
}

export type AuctionDetailExtra = {
  description: string
  condition: string
  seller: string
  sellerVerified: boolean
  startingBid: number
  views: number
  bidIncrement: number
  countdownInitial: { h: number; m: number; s: number }
  bidHistory: BidHistoryEntry[]
  priceHistory: PriceHistoryPoint[]
}

export type AuctionDetail = AuctionItem & AuctionDetailExtra

const DETAILS: Record<string, AuctionDetailExtra> = {
  '1': {
    description:
      'Authentic vintage Rolex Submariner reference in excellent mechanical and cosmetic condition. Recently serviced, keeps excellent time. Original dial and hands with warm patina. Case shows light honest wear consistent with age. A standout piece for collectors seeking a classic diver with strong investment potential.',
    condition: 'Excellent',
    seller: 'TimeKeeper_Pro',
    sellerVerified: true,
    startingBid: 8000,
    views: 1247,
    bidIncrement: 50,
    countdownInitial: { h: 1, m: 49, s: 44 },
    bidHistory: [
      { id: 'b1', user: 'WatchFan88', time: 'May 13, 2026 · 2:14 PM', amount: 12500 },
      { id: 'b2', user: 'CoastalBidder', time: 'May 13, 2026 · 1:02 PM', amount: 12200 },
      { id: 'b3', user: 'LuxuryLane', time: 'May 13, 2026 · 11:40 AM', amount: 11800 },
      { id: 'b4', user: 'TimeKeeper_Pro', time: 'May 12, 2026 · 6:15 PM', amount: 11200 },
      { id: 'b5', user: 'VintageVault', time: 'May 12, 2026 · 9:22 AM', amount: 9800 },
    ],
    priceHistory: [
      { label: '12h ago', value: 8200 },
      { label: '9h ago', value: 9100 },
      { label: '6h ago', value: 9800 },
      { label: '3h ago', value: 10800 },
      { label: '1h ago', value: 11800 },
      { label: 'Now', value: 12500 },
    ],
  },
  '2': {
    description:
      'MacBook Pro 16-inch with M3 Max, 36GB unified memory, and 1TB SSD. AppleCare+ eligible. Battery cycle count low. No dents or scratches on chassis; display is flawless. Includes original box and 140W charger. Ideal for creative professionals and developers.',
    condition: 'Like New',
    seller: 'TechResale_NYC',
    sellerVerified: true,
    startingBid: 2200,
    views: 892,
    bidIncrement: 25,
    countdownInitial: { h: 4, m: 59, s: 12 },
    bidHistory: [
      { id: 'b1', user: 'DevStudio_AJ', time: 'May 13, 2026 · 3:01 PM', amount: 2800 },
      { id: 'b2', user: 'RemoteWorker42', time: 'May 13, 2026 · 12:18 PM', amount: 2750 },
      { id: 'b3', user: 'CampusTech', time: 'May 12, 2026 · 8:44 PM', amount: 2600 },
      { id: 'b4', user: 'TechResale_NYC', time: 'May 12, 2026 · 4:30 PM', amount: 2450 },
    ],
    priceHistory: [
      { label: '12h ago', value: 2280 },
      { label: '9h ago', value: 2360 },
      { label: '6h ago', value: 2480 },
      { label: '3h ago', value: 2620 },
      { label: 'Now', value: 2800 },
    ],
  },
  '3': {
    description:
      'Limited edition screen print in excellent condition, stored flat in archival materials. COA from reputable gallery included. Edition number disclosed to winning bidder. Serious inquiries only — provenance documentation available upon request.',
    condition: 'Excellent',
    seller: 'GalleryNorth',
    sellerVerified: true,
    startingBid: 5200,
    views: 2103,
    bidIncrement: 100,
    countdownInitial: { h: 7, m: 59, s: 0 },
    bidHistory: [
      { id: 'b1', user: 'UrbanCollector', time: 'May 13, 2026 · 4:22 PM', amount: 8900 },
      { id: 'b2', user: 'ArtHouse_Bid', time: 'May 13, 2026 · 1:55 PM', amount: 8200 },
      { id: 'b3', user: 'GalleryNorth', time: 'May 12, 2026 · 7:10 PM', amount: 7600 },
    ],
    priceHistory: [
      { label: '12h ago', value: 5400 },
      { label: '8h ago', value: 6200 },
      { label: '4h ago', value: 7400 },
      { label: 'Now', value: 8900 },
    ],
  },
  '4': {
    description:
      'Nike Air Jordan 1 Retro High OG in Chicago colorway. Deadstock with original box and receipt. Size as tagged. Stored in a smoke-free environment. Minor box wear only.',
    condition: 'New',
    seller: 'SneakerVault',
    sellerVerified: true,
    startingBid: 280,
    views: 456,
    bidIncrement: 10,
    countdownInitial: { h: 11, m: 59, s: 30 },
    bidHistory: [
      { id: 'b1', user: 'KicksDaily', time: 'May 13, 2026 · 10:12 AM', amount: 450 },
      { id: 'b2', user: 'HoopDreams', time: 'May 12, 2026 · 6:40 PM', amount: 420 },
    ],
    priceHistory: [
      { label: '12h ago', value: 300 },
      { label: '6h ago', value: 360 },
      { label: 'Now', value: 450 },
    ],
  },
  '5': {
    description:
      'Herman Miller Aeron Size B, fully adjustable with lumbar. Mesh in very good condition; no tears. Recently cleaned and inspected. Pickup available in metro area or ships freight.',
    condition: 'Very Good',
    seller: 'OfficeLiquidators',
    sellerVerified: false,
    startingBid: 400,
    views: 321,
    bidIncrement: 10,
    countdownInitial: { h: 14, m: 59, s: 0 },
    bidHistory: [
      { id: 'b1', user: 'WFH_Setup', time: 'May 13, 2026 · 9:05 AM', amount: 620 },
      { id: 'b2', user: 'StartupFurnish', time: 'May 12, 2026 · 3:12 PM', amount: 540 },
    ],
    priceHistory: [
      { label: '12h ago', value: 420 },
      { label: '6h ago', value: 500 },
      { label: 'Now', value: 620 },
    ],
  },
  '6': {
    description:
      'Official Spalding basketball signed by Michael Jordan with Upper Deck authentication sticker. Display case included. Signature clear and bold; minor display case scuffs only.',
    condition: 'Excellent',
    seller: 'SportsMemorabiliaCo',
    sellerVerified: true,
    startingBid: 1200,
    views: 1544,
    bidIncrement: 50,
    countdownInitial: { h: 19, m: 59, s: 45 },
    bidHistory: [
      { id: 'b1', user: 'CourtSide_Collector', time: 'May 13, 2026 · 2:40 PM', amount: 1850 },
      { id: 'b2', user: 'ChiSportsFan', time: 'May 12, 2026 · 8:05 PM', amount: 1600 },
    ],
    priceHistory: [
      { label: '12h ago', value: 1250 },
      { label: '6h ago', value: 1480 },
      { label: 'Now', value: 1850 },
    ],
  },
  '7': {
    description:
      'Gibson Les Paul Standard 1959 Reissue in factory case. Frets show minimal wear; electronics tested. Beautiful top carve and burst finish. Setup with 10–46 strings.',
    condition: 'Very Good',
    seller: 'SixStringSales',
    sellerVerified: true,
    startingBid: 3600,
    views: 678,
    bidIncrement: 50,
    countdownInitial: { h: 23, m: 59, s: 15 },
    bidHistory: [
      { id: 'b1', user: 'BluesBar_J', time: 'May 13, 2026 · 11:58 AM', amount: 4200 },
      { id: 'b2', user: 'StudioSix', time: 'May 12, 2026 · 5:22 PM', amount: 3900 },
    ],
    priceHistory: [
      { label: '12h ago', value: 3700 },
      { label: '6h ago', value: 3950 },
      { label: 'Now', value: 4200 },
    ],
  },
  '8': {
    description:
      '18K white gold tennis bracelet with round brilliant diamonds, approximately 4 ctw. Appraisal available. Clasp secure with safety latch. Recently polished.',
    condition: 'Excellent',
    seller: 'FineJewelsAuctions',
    sellerVerified: true,
    startingBid: 2400,
    views: 933,
    bidIncrement: 50,
    countdownInitial: { h: 51, m: 3, s: 0 },
    bidHistory: [
      { id: 'b1', user: 'SparkleSeeker', time: 'May 13, 2026 · 1:18 PM', amount: 3200 },
      { id: 'b2', user: 'AnniversaryGift', time: 'May 12, 2026 · 7:50 PM', amount: 2900 },
    ],
    priceHistory: [
      { label: '12h ago', value: 2500 },
      { label: '6h ago', value: 2750 },
      { label: 'Now', value: 3200 },
    ],
  },
}

function idHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function buildDefaultAuctionDetail(item: AuctionItem): AuctionDetailExtra {
  const record = getAuctionRecord(item.id)
  const start =
    record != null || item.sellerName
      ? Math.max(1, item.currentBid)
      : Math.max(1, Math.floor(item.currentBid * 0.88))

  const bidHistory =
    record != null
      ? record.bidHistory.map((b) => ({ ...b }))
      : item.bids > 0 && item.currentBid > 0
        ? [
            {
              id: 'open',
              user: 'Bidder',
              time: '—',
              amount: item.currentBid,
            },
          ]
        : []

  const remain = item.auctionEndsAt ? secondsUntil(item.auctionEndsAt) : null
  const countdownInitial =
    remain != null
      ? secondsToHmsParts(remain)
      : { h: 48 + (idHash(item.id) % 24), m: (idHash(item.id) >> 3) % 60, s: 0 }

  return {
    description:
      item.listingDescription ??
      'This listing was published by a seller on BidZone. Inspect photos and description carefully before bidding.',
    condition: item.condition ?? 'Good',
    seller: item.sellerName ?? 'You',
    sellerVerified: false,
    startingBid: start,
    views: 120 + (idHash(item.id) % 900),
    bidIncrement: item.currentBid >= 1000 ? 50 : item.currentBid >= 100 ? 10 : 5,
    countdownInitial,
    bidHistory,
    priceHistory: [
      { label: '12h ago', value: start },
      { label: 'Now', value: item.currentBid },
    ],
  }
}

export function getAuctionDetail(id: string, catalog: AuctionItem[]): AuctionDetail | undefined {
  const item = catalog.find((a) => a.id === id)
  if (!item) return undefined
  const template = DETAILS[id] ?? buildDefaultAuctionDetail(item)
  const live = getLiveBidState(id)
  const extra: AuctionDetailExtra =
    live && live.history.length > 0 ? { ...template, bidHistory: live.history } : template
  return { ...item, ...extra }
}
