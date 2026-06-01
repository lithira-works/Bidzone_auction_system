/**
 * Simulated auction "database" in localStorage: each listing has metadata and bid history.
 * New listings start with an empty bidHistory[] per Phase 2 flowchart.
 */

export type StoredBidHistoryEntry = {
  id: string
  user: string
  time: string
  amount: number
}

export type AuctionRecord = {
  id: string
  createdAt: string
  endsAt: string
  bidHistory: StoredBidHistoryEntry[]
}

const STORAGE_KEY = 'bidzone-auction-records'

function loadStore(): Record<string, AuctionRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, AuctionRecord>
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, AuctionRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getAuctionRecord(id: string): AuctionRecord | null {
  const r = loadStore()[id]
  if (!r || !r.id) return null
  return {
    ...r,
    bidHistory: Array.isArray(r.bidHistory) ? r.bidHistory : [],
  }
}

/** Create or update record when saving a listing; preserves bidHistory when updating endsAt. */
export function syncAuctionRecordFromItem(item: {
  id: string
  auctionEndsAt?: string
  auctionCreatedAt?: string
}): void {
  if (!item.auctionEndsAt) return
  const store = loadStore()
  const existing = store[item.id]
  const createdAt = item.auctionCreatedAt ?? existing?.createdAt ?? new Date().toISOString()
  if (!existing) {
    store[item.id] = {
      id: item.id,
      createdAt,
      endsAt: item.auctionEndsAt,
      bidHistory: [],
    }
  } else {
    store[item.id] = {
      ...existing,
      createdAt: existing.createdAt || createdAt,
      endsAt: item.auctionEndsAt,
    }
  }
  saveStore(store)
}

/** Append a bid for seller-created auctions; creates a minimal record if missing (legacy listings). */
export function appendBidToUserAuction(
  id: string,
  entry: StoredBidHistoryEntry,
  endsAtFallback?: string,
): void {
  const store = loadStore()
  const existing = store[id]
  if (!existing) {
    store[id] = {
      id,
      createdAt: new Date().toISOString(),
      endsAt: endsAtFallback ?? new Date(Date.now() + 7 * 864e5).toISOString(),
      bidHistory: [entry],
    }
  } else {
    store[id] = {
      ...existing,
      bidHistory: [entry, ...existing.bidHistory],
    }
  }
  saveStore(store)
}
