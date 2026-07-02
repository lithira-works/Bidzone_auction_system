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
import { type AuctionItem } from '@/data/auctions'
import {
  appendBidToUserAuction,
  syncAuctionRecordFromItem,
  type StoredBidHistoryEntry,
} from '@/lib/auctionRecords'
import { getLiveBidState } from '@/lib/liveAuctionBids'
import { api, getToken } from '@/lib/apiClient'

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
  /** Approved listings shown on the marketplace */
  marketplaceCatalog: AuctionItem[]
  /** Seller's listings (includes pending / rejected) */
  myListings: AuctionItem[]
  /** @deprecated use marketplaceCatalog */
  mergedCatalog: AuctionItem[]
  /** @deprecated use myListings */
  userListings: AuctionItem[]
  addListing: (item: AuctionItem) => Promise<{ pendingApproval: boolean }>
  updateListing: (item: AuctionItem) => Promise<{ pendingApproval: boolean }>
  deleteListing: (id: string) => Promise<boolean>
  refreshCatalog: () => Promise<void>
  fetchListingById: (id: string) => Promise<AuctionItem | null>
  placeBid: (args: PlaceBidArgs) => Promise<{ ok: boolean; error?: string; bcBalance?: number }>
}

const ListingsContext = createContext<ListingsContextValue | null>(null)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [marketplaceCatalog, setMarketplaceCatalog] = useState<AuctionItem[]>([])
  const [myListings, setMyListings] = useState<AuctionItem[]>([])
  const [liveBidEpoch, setLiveBidEpoch] = useState(0)
  const myListingsRef = useRef(myListings)
  myListingsRef.current = myListings

  const refreshCatalog = useCallback(async () => {
    try {
      const { auctions } = await api.get<{ auctions: AuctionItem[] }>('/auctions')
      setMarketplaceCatalog(auctions)
      auctions.forEach((item) => syncAuctionRecordFromItem(item))
    } catch {
      setMarketplaceCatalog([])
    }

    const token = getToken()
    if (!token) {
      setMyListings([])
      return
    }

    try {
      const { auctions: mine } = await api.get<{ auctions: AuctionItem[] }>('/auctions/mine')
      setMyListings(mine)
      mine.forEach((item) => syncAuctionRecordFromItem(item))
    } catch {
      setMyListings([])
    }
  }, [])

  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])

  const fetchListingById = useCallback(async (id: string): Promise<AuctionItem | null> => {
    const fromMarket = marketplaceCatalog.find((a) => a.id === id)
    if (fromMarket) return fromMarket
    const fromMine = myListings.find((a) => a.id === id)
    if (fromMine) return fromMine
    try {
      const { auction } = await api.get<{ auction: AuctionItem }>(`/auctions/${id}`)
      return auction
    } catch {
      return null
    }
  }, [marketplaceCatalog, myListings])

  const addListing = useCallback(async (item: AuctionItem): Promise<{ pendingApproval: boolean }> => {
    try {
      const res = await api.post<{ auction: AuctionItem; pendingApproval?: boolean }>('/auctions', item)
      setMyListings((prev) => {
        const next = [res.auction, ...prev.filter((p) => p.id !== res.auction.id)]
        syncAuctionRecordFromItem(res.auction)
        return next
      })
      return { pendingApproval: res.pendingApproval ?? true }
    } catch {
      return { pendingApproval: true }
    }
  }, [])

  const deleteListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/auctions/${id}`)
      setMyListings((prev) => prev.filter((p) => p.id !== id))
      setMarketplaceCatalog((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  const updateListing = useCallback(async (item: AuctionItem): Promise<{ pendingApproval: boolean }> => {
    try {
      const res = await api.put<{ auction: AuctionItem; pendingApproval?: boolean }>(
        `/auctions/${item.id}`,
        item,
      )
      setMyListings((prev) => {
        const idx = prev.findIndex((p) => p.id === res.auction.id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = res.auction
        syncAuctionRecordFromItem(res.auction)
        return next
      })
      if (res.auction.moderationStatus === 'approved') {
        await refreshCatalog()
      }
      return { pendingApproval: res.pendingApproval ?? false }
    } catch {
      return { pendingApproval: false }
    }
  }, [refreshCatalog])

  const placeBid = useCallback(async (args: PlaceBidArgs): Promise<{ ok: boolean; error?: string; bcBalance?: number }> => {
    if (args.amount < args.minBid) return { ok: false, error: 'Bid is below the minimum.' }

    const entry: StoredBidHistoryEntry = {
      id: `b-${crypto.randomUUID()}`,
      user: 'You',
      time: new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
      amount: args.amount,
    }

    const inMine = myListingsRef.current.some((u) => u.id === args.auctionId)

    try {
      const { bid, bcBalance } = await api.post<{ bid: StoredBidHistoryEntry; bcBalance?: number }>(
        `/auctions/${args.auctionId}/bids`,
        { amount: args.amount, minBid: args.minBid },
      )

      const updateItem = (cur: AuctionItem) => ({
        ...cur,
        currentBid: args.amount,
        bids: cur.bids + 1,
      })

      setMarketplaceCatalog((prev) => {
        const idx = prev.findIndex((u) => u.id === args.auctionId)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = updateItem(prev[idx])
        return next
      })

      if (inMine) {
        setMyListings((prev) => {
          const idx = prev.findIndex((u) => u.id === args.auctionId)
          if (idx === -1) return prev
          const cur = prev[idx]
          const next = [...prev]
          next[idx] = updateItem(cur)
          appendBidToUserAuction(args.auctionId, bid, cur.auctionEndsAt)
          return next
        })
      } else {
        const { updateLiveBidState } = await import('@/lib/liveAuctionBids')
        const base = marketplaceCatalog.find((a) => a.id === args.auctionId)
        updateLiveBidState({
          auctionId: args.auctionId,
          amount: args.amount,
          baseFromCatalog: base
            ? { currentBid: base.currentBid, bids: base.bids }
            : { currentBid: args.amount, bids: 0 },
          entry: bid,
          seedHistory: args.seedBidHistory,
        })
      }

      setLiveBidEpoch((e) => e + 1)
      return { ok: true, bcBalance }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Bid failed. Please try again.' }
    }
  }, [marketplaceCatalog])

  const catalogWithLive = useMemo(() => {
    return marketplaceCatalog.map(applyLiveBidOverlay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplaceCatalog, liveBidEpoch])

  const value = useMemo(
    () => ({
      marketplaceCatalog: catalogWithLive,
      myListings,
      mergedCatalog: catalogWithLive,
      userListings: myListings,
      addListing,
      updateListing,
      deleteListing,
      refreshCatalog,
      fetchListingById,
      placeBid,
    }),
    [
      catalogWithLive,
      myListings,
      addListing,
      updateListing,
      deleteListing,
      refreshCatalog,
      fetchListingById,
      placeBid,
    ],
  )

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>
}

export function useListings() {
  const ctx = useContext(ListingsContext)
  if (!ctx) throw new Error('useListings must be used within ListingsProvider')
  return ctx
}
