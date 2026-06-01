'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { allAuctions, type AuctionItem } from '@/data/auctions'
import { appendBidToUserAuction, type StoredBidHistoryEntry, syncAuctionRecordFromItem } from '@/lib/auctionRecords'
import { getLiveBidState, placeLiveBid } from '@/lib/liveAuctionBids'

const STORAGE_KEY = 'bidzone-user-listings'

function loadListings(): AuctionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x) => x && typeof (x as AuctionItem).id === 'string') as AuctionItem[]
  } catch {
    return []
  }
}

function saveListings(items: AuctionItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function mergeCatalog(user: AuctionItem[]): AuctionItem[] {
  return [...user, ...allAuctions.filter((a) => !user.some((u) => u.id === a.id))]
}

function applyLiveBidOverlay(item: AuctionItem): AuctionItem {
  const live = getLiveBidState(item.id)
  if (!live) return item
  return { ...item, currentBid: live.currentBid, bids: live.bids }
}

export type PlaceBidArgs = {
  auctionId: string
  amount: number
  minBid: number
  seedBidHistory: StoredBidHistoryEntry[]
}

type ListingsContextValue = {
  userListings: AuctionItem[]
  addListing: (item: AuctionItem) => void
  updateListing: (item: AuctionItem) => void
  mergedCatalog: AuctionItem[]
  placeBid: (args: PlaceBidArgs) => boolean
}

const ListingsContext = createContext<ListingsContextValue | null>(null)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [userListings, setUserListings] = useState<AuctionItem[]>([])
  const [liveBidEpoch, setLiveBidEpoch] = useState(0)
  const userListingsRef = useRef(userListings)
  userListingsRef.current = userListings

  useEffect(() => {
    setUserListings(loadListings())
  }, [])

  const addListing = useCallback((item: AuctionItem) => {
    setUserListings((prev) => {
      const next = [item, ...prev.filter((p) => p.id !== item.id)]
      saveListings(next)
      syncAuctionRecordFromItem(item)
      return next
    })
  }, [])

  const updateListing = useCallback((item: AuctionItem) => {
    setUserListings((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = item
      saveListings(next)
      syncAuctionRecordFromItem(item)
      return next
    })
  }, [])

  const placeBid = useCallback((args: PlaceBidArgs): boolean => {
    if (args.amount < args.minBid) return false
    const entry: StoredBidHistoryEntry = {
      id: `b-${crypto.randomUUID()}`,
      user: 'You',
      time: new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
      amount: args.amount,
    }

    const prev = userListingsRef.current
    const userIdx = prev.findIndex((u) => u.id === args.auctionId)
    if (userIdx >= 0) {
      const cur = prev[userIdx]
      const next = [...prev]
      next[userIdx] = { ...cur, currentBid: args.amount, bids: cur.bids + 1 }
      saveListings(next)
      setUserListings(next)
      appendBidToUserAuction(args.auctionId, entry, cur.auctionEndsAt)
      setLiveBidEpoch((e) => e + 1)
      return true
    }

    const staticBase = allAuctions.find((a) => a.id === args.auctionId)
    if (!staticBase) return false
    const ok = placeLiveBid({
      auctionId: args.auctionId,
      amount: args.amount,
      minBid: args.minBid,
      baseFromCatalog: { currentBid: staticBase.currentBid, bids: staticBase.bids },
      seedHistory: args.seedBidHistory,
    })
    if (ok) setLiveBidEpoch((e) => e + 1)
    return ok
  }, [])

  const mergedCatalog = useMemo(() => {
    const base = mergeCatalog(userListings)
    return base.map(applyLiveBidOverlay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userListings, liveBidEpoch])

  const value = useMemo(
    () => ({ userListings, addListing, updateListing, mergedCatalog, placeBid }),
    [userListings, addListing, updateListing, mergedCatalog, placeBid],
  )

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>
}

export function useListings() {
  const ctx = useContext(ListingsContext)
  if (!ctx) throw new Error('useListings must be used within ListingsProvider')
  return ctx
}
