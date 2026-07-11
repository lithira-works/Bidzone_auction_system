'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Eye, Gavel, Heart, Share2, ShoppingCart, ShieldCheck,
  TrendingUp, Zap, CheckCircle, Lock, AlertTriangle, Clock,
  Trophy, RefreshCw, ChevronLeft, ChevronRight, X, Star, Package, Tag,
  Bot, Users, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PriceHistoryChart } from '@/components/ui/PriceHistoryChart'
import { WinProbabilityGauge } from '@/components/ui/WinProbabilityGauge'
import { BcCoin } from '@/components/ui/BcCoin'
import { getAuctionDetail } from '@/data/auctionDetails'
import type { AuctionItem } from '@/data/auctions'
import { secondsUntil } from '@/lib/auctionTime'
import { estimateWinProbability } from '@/lib/winProbability'
import { bidCoachAmounts } from '@/lib/bidCoach'
import { api } from '@/lib/apiClient'
import { useListings } from '@/context/ListingsContext'
import { useAuth } from '@/context/AuthContext'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useI18n } from '@/context/I18nContext'

/* ── Helpers ── */
function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
function toSeconds(t: { h: number; m: number; s: number }) {
  return Math.max(0, t.h * 3600 + t.m * 60 + t.s)
}
function formatHMS(total: number) {
  const t = Math.max(0, total)
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return {
    d: String(d).padStart(2, '0'),
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

const AVATAR_COLORS = [
  '#d97706', '#7c3aed', '#0891b2', '#059669',
  '#be185d', '#b45309', '#dc2626', '#0284c7',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
}

/* ── Types ── */
type BidRow = { id: string; user: string; time: string; amount: number; placedAtIso?: string }
type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: string; kind: ToastKind; msg: string }

const ANTI_SNIPING_WINDOW_SEC = 15 * 60
const POLL_INTERVAL_MS = 12_000

/* ── Price history ranges ── */
type PriceRange = '12h' | '24h' | '1w' | '1m' | 'all'
const PRICE_RANGES: { key: PriceRange; label: string; ms: number | null }[] = [
  { key: '12h', label: '12H', ms: 12 * 3600_000 },
  { key: '24h', label: '24H', ms: 24 * 3600_000 },
  { key: '1w',  label: '1W',  ms: 7 * 86_400_000 },
  { key: '1m',  label: '1M',  ms: 30 * 86_400_000 },
  { key: 'all', label: 'All', ms: null },
]

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { mergedCatalog, placeBid, fetchListingById } = useListings()
  const { user, isAuthenticated, updateUser } = useAuth()
  const { has, toggle } = useWishlist()
  const { has: cartHasItem, add: addToCart } = useCart()
  const { addBidPlaced, addLotBroadcast } = useNotifications()
  const { t } = useI18n()

  /* ── State ── */
  const [extraItem, setExtraItem]       = useState<AuctionItem | null>(null)
  const [liveItem, setLiveItem]         = useState<AuctionItem | null>(null)
  const [liveBids, setLiveBids]         = useState<BidRow[] | null>(null)
  const [bidsLoading, setBidsLoading]   = useState(false)
  const [toasts, setToasts]             = useState<ToastItem[]>([])
  const [bidLoading, setBidLoading]     = useState(false)
  const [activeImage, setActiveImage]   = useState(0)
  const [imageZoomed, setImageZoomed]   = useState(false)
  const [copied, setCopied]             = useState(false)
  const [autoModal, setAutoModal]       = useState(false)
  const [autoBidMax, setAutoBidMax]     = useState(0)
  const [autoBidActive, setAutoBidActive] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Seed from catalog ── */
  useEffect(() => {
    if (!id) return
    if (mergedCatalog.some((a) => a.id === id)) { setExtraItem(null); return }
    void fetchListingById(id).then((item) => setExtraItem(item))
  }, [id, mergedCatalog, fetchListingById])

  const catalogForDetail = useMemo(() => {
    if (!extraItem) return mergedCatalog
    if (mergedCatalog.some((a) => a.id === extraItem.id)) return mergedCatalog
    return [...mergedCatalog, extraItem]
  }, [mergedCatalog, extraItem])

  const baseDetail = id ? getAuctionDetail(id, catalogForDetail) : undefined

  /* Merge live-polled data over the base (keeps mock fallbacks for untracked fields) */
  const detail = useMemo(() => {
    if (!baseDetail) return undefined
    if (!liveItem) return baseDetail
    return {
      ...baseDetail,
      currentBid: liveItem.currentBid,
      bids: liveItem.bids,
      auctionEndsAt: liveItem.auctionEndsAt ?? baseDetail.auctionEndsAt,
      moderationStatus: liveItem.moderationStatus ?? baseDetail.moderationStatus,
    }
  }, [baseDetail, liveItem])

  const isPending  = detail?.moderationStatus === 'pending'
  const isRejected = detail?.moderationStatus === 'rejected'
  const isEnded    = useMemo(() => {
    if (!detail?.auctionEndsAt) return false
    return secondsUntil(detail.auctionEndsAt) <= 0
  }, [detail])
  const canBid = !isPending && !isRejected && !isEnded && isAuthenticated

  /* ── Live bid history from DB ── */
  const fetchBids = useCallback(async () => {
    if (!id) return
    setBidsLoading(true)
    try {
      const data = await api.get<{ bids: BidRow[] }>(`/auctions/${id}/bids`)
      setLiveBids(data.bids ?? [])
    } catch { /* fall through to seed data */ }
    finally { setBidsLoading(false) }
  }, [id])

  /* ── Live auction polling ── */
  const pollAuction = useCallback(async () => {
    if (!id) return
    try {
      const data = await api.get<{ auction: AuctionItem }>(`/auctions/${id}`)
      if (data.auction) setLiveItem(data.auction)
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => {
    void fetchBids()
    void pollAuction()
    pollRef.current = setInterval(() => {
      void pollAuction()
      void fetchBids()
    }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id, fetchBids, pollAuction])

  /* ── Derived bid data ── */
  const displayedBids: BidRow[] = liveBids ?? (detail?.bidHistory ?? [])
  const topBidder = displayedBids[0] ?? null
  const userIsLeading = isAuthenticated && user && topBidder && topBidder.user === user.fullName

  /* ── Price history with selectable time range ── */
  const [priceRange, setPriceRange] = useState<PriceRange>('all')

  const chartData = useMemo(() => {
    const rows = (liveBids ?? [])
      .filter((b) => b.placedAtIso)
      .map((b) => ({ t: new Date(b.placedAtIso!).getTime(), amount: b.amount }))
      .filter((r) => Number.isFinite(r.t))
      .sort((a, b) => a.t - b.t)

    /* No real bids in the DB yet — fall back to the seeded history, stats hidden */
    if (rows.length === 0) {
      return { points: baseDetail?.priceHistory ?? [], stats: null, empty: false }
    }

    const rangeMs = PRICE_RANGES.find((r) => r.key === priceRange)?.ms ?? null
    const cutoff = rangeMs != null ? Date.now() - rangeMs : null
    const inRange = cutoff != null ? rows.filter((r) => r.t >= cutoff) : rows

    if (inRange.length === 0) {
      return { points: [], stats: null, empty: true }
    }

    const shortRange = priceRange === '12h' || priceRange === '24h'
    const fmt = (t: number) =>
      shortRange
        ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    /* Baseline: the price when the window opens — last bid before the cutoff,
       or the starting bid when showing the full history */
    const before = cutoff != null ? rows.filter((r) => r.t < cutoff) : []
    const baseline = before.length > 0
      ? before[before.length - 1].amount
      : (baseDetail?.startingBid ?? inRange[0].amount)

    const points = [
      cutoff != null
        ? { label: fmt(cutoff), value: baseline }
        : { label: 'Start', value: baseDetail?.startingBid ?? inRange[0].amount },
      ...inRange.map((r) => ({ label: fmt(r.t), value: r.amount })),
    ]

    const first = points[0].value
    const last = points[points.length - 1].value
    const delta = last - first
    const pct = first > 0 ? (delta / first) * 100 : 0
    const high = Math.max(...points.map((p) => p.value))
    const low = Math.min(...points.map((p) => p.value))

    return { points, stats: { delta, pct, high, low, count: inRange.length }, empty: false }
  }, [liveBids, priceRange, baseDetail])

  /* ── Bid intelligence stats ── */
  const uniqueBidders = new Set(displayedBids.map((b) => b.user)).size
  const avgBidStep = displayedBids.length >= 2
    ? Math.round((displayedBids[0].amount - displayedBids[displayedBids.length - 1].amount) / (displayedBids.length - 1))
    : 0

  /* ── Gallery ── */
  const galleryImages = useMemo(() => {
    if (!detail) return []
    return detail.images?.length ? detail.images : [detail.image]
  }, [detail])
  useEffect(() => { setActiveImage(0) }, [detail?.id])

  /* ── Bid amounts ── */
  const bidIncrement = detail?.bidIncrement ?? 5
  const minBid = detail ? detail.currentBid + bidIncrement : 0
  const [bidAmount, setBidAmount] = useState(minBid)
  const inWishlist = detail ? has(detail.id) : false
  const cartHas    = detail ? cartHasItem(detail.id) : false

  useEffect(() => {
    if (detail) {
      setBidAmount(detail.currentBid + bidIncrement)
      setAutoBidMax(detail.currentBid + bidIncrement * 5)
    }
  }, [detail?.id, detail?.currentBid, bidIncrement])

  /* ── Countdown ── */
  const [remainSec, setRemainSec] = useState(() => detail ? toSeconds(detail.countdownInitial) : 0)
  useEffect(() => {
    if (!detail) return
    if (detail.auctionEndsAt) {
      const tick = () => setRemainSec(secondsUntil(detail.auctionEndsAt!))
      tick()
      const tid = window.setInterval(tick, 1000)
      return () => window.clearInterval(tid)
    }
    setRemainSec(toSeconds(detail.countdownInitial))
    const tid = window.setInterval(() => setRemainSec((r) => (r > 0 ? r - 1 : 0)), 1000)
    return () => window.clearInterval(tid)
  }, [detail])

  const clock = useMemo(() => formatHMS(remainSec), [remainSec])
  const showDays           = parseInt(clock.d) > 0
  const urgentCountdown    = !isEnded && remainSec > 0 && remainSec <= 60
  const showAntiSnipeBanner = !isEnded && !!detail?.auctionEndsAt && remainSec > 0 && remainSec <= ANTI_SNIPING_WINDOW_SEC
  const reserveMet = detail?.reservePrice != null && detail.currentBid >= detail.reservePrice

  /* ── Win probability ── */
  const winPct = useMemo(() => {
    if (!detail) return 48
    return estimateWinProbability({ yourBid: bidAmount, minBid, urgencySec: remainSec })
  }, [detail, bidAmount, minBid, remainSec])

  /* ── Quick-bid presets ── */
  const quickAmounts = useMemo(() => {
    if (!detail) return []
    return [1, 2, 5, 10].map((mult) => detail.currentBid + bidIncrement * mult)
  }, [detail, bidIncrement])

  /* ── Toast system ── */
  function showToast(kind: ToastKind, msg: string) {
    const tid = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id: tid, kind, msg }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== tid)), 4500)
  }
  function dismissToast(tid: string) {
    setToasts((prev) => prev.filter((x) => x.id !== tid))
  }

  /* ── Share ── */
  const handleShare = useCallback(async () => {
    if (!detail) return
    const url = window.location.href
    try {
      if (navigator.share) { await navigator.share({ title: detail.title, url }); showToast('success', 'Shared successfully!') }
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); showToast('success', 'Link copied to clipboard') }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail])

  /* ── Place bid ── */
  const handlePlaceBid = useCallback(async () => {
    if (!detail || !canBid) return
    if (!isAuthenticated) { showToast('error', 'Please sign in to place a bid'); return }
    if (!Number.isFinite(bidAmount) || bidAmount < minBid) {
      showToast('error', `Minimum bid is ${formatMoney(minBid)}`); return
    }
    setBidLoading(true)
    const res = await placeBid({
      auctionId: detail.id,
      amount: bidAmount,
      minBid,
      seedBidHistory: detail.bidHistory.map((r) => ({ id: r.id, user: r.user, time: r.time, amount: r.amount })),
    })
    setBidLoading(false)
    if (!res.ok) {
      const isBC = res.error?.includes('BidZone Currency') || res.error?.includes('BC') || res.error?.includes('Insufficient')
      showToast('error', res.error ?? 'Failed to place bid')
      if (isBC) showToast('info', 'Top up your BC wallet in the Coin Store →')
      return
    }
    if (res.bcBalance != null) updateUser({ bcBalance: res.bcBalance })
    addBidPlaced(bidAmount, detail.title)
    addLotBroadcast(detail.title, bidAmount)
    showToast('success', `Bid of ${formatMoney(bidAmount)} placed!`)
    void fetchBids()
    void pollAuction()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, bidAmount, minBid, placeBid, canBid, isAuthenticated, addBidPlaced, addLotBroadcast, updateUser, fetchBids, pollAuction])

  /* ── Buy now ── */
  const handleBuyNow = useCallback(() => {
    if (!detail || detail.buyNow == null) return
    addToCart(detail.id)
    showToast('success', 'Added to cart!')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, addToCart])

  /* ── Auto-bid confirm ── */
  const handleAutoBidConfirm = useCallback(() => {
    if (!detail || !canBid) return
    if (!isAuthenticated) { showToast('error', 'Please sign in to use Auto-Bid'); return }
    if (autoBidMax < minBid) { showToast('error', `Auto-bid max must be at least ${formatMoney(minBid)}`); return }
    setAutoBidActive(true)
    setAutoModal(false)
    showToast('info', `Auto-Bid activated — max ${formatMoney(autoBidMax)}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, canBid, isAuthenticated, autoBidMax, minBid])

  /* ── Redirect if not found ── */
  useEffect(() => {
    if (!id || !baseDetail) router.replace('/home')
  }, [id, baseDetail, router])

  if (!id || !detail) return null

  const { refHigh, suggest } = bidCoachAmounts(detail.currentBid, minBid)

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="pd">
      <SiteHeader />

      {/* ── Toast notifications ── */}
      <div className="pd__toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`pd__toast pd__toast--${t.kind}`}>
            {t.kind === 'success' && <CheckCircle size={15} aria-hidden />}
            {t.kind === 'error'   && <AlertTriangle size={15} aria-hidden />}
            {t.kind === 'info'    && <Clock size={15} aria-hidden />}
            <span className="pd__toast-msg">{t.msg}</span>
            {(t.msg.includes('BC') || t.msg.includes('Coin Store')) && (
              <Link href="/coins" className="pd__toast-link">Top up →</Link>
            )}
            <button type="button" className="pd__toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Auto-bid modal ── */}
      {autoModal && (
        <div className="pd__modal-overlay" role="dialog" aria-modal="true" aria-label="Auto-Bid settings" onClick={() => setAutoModal(false)}>
          <div className="pd__modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd__modal-header">
              <h2 className="pd__modal-title"><Zap size={18} /> Auto-Bid</h2>
              <button type="button" className="pd__modal-close" onClick={() => setAutoModal(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <p className="pd__modal-body">
              Set your maximum bid. BidZone will automatically outbid competitors — one increment at a time — up to your limit.
            </p>
            <label className="pd__modal-label" htmlFor="auto-bid-max">Maximum Bid</label>
            <div className="pd__modal-input-wrap">
              <span className="pd__modal-dollar">$</span>
              <input
                id="auto-bid-max"
                type="number"
                min={minBid}
                step={bidIncrement}
                value={autoBidMax}
                onChange={(e) => setAutoBidMax(Number(e.target.value))}
                className="pd__modal-input"
              />
            </div>
            <p className="pd__modal-hint">Current minimum bid: {formatMoney(minBid)}</p>
            <div className="pd__modal-actions">
              <button type="button" className="pd__modal-cancel" onClick={() => setAutoModal(false)}>Cancel</button>
              <button type="button" className="pd__modal-confirm" onClick={handleAutoBidConfirm}>
                <Zap size={15} /> Activate Auto-Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image zoom overlay ── */}
      {imageZoomed && (
        <div className="pd__zoom-overlay" role="dialog" aria-label="Zoomed image" onClick={() => setImageZoomed(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryImages[activeImage] ?? detail.image} alt={detail.title} className="pd__zoom-img" />
          <button type="button" className="pd__zoom-close" onClick={() => setImageZoomed(false)} aria-label="Close zoom">
            <X size={20} />
          </button>
        </div>
      )}

      <main className="pd__wrap">
        {/* Breadcrumb */}
        <nav className="pd__breadcrumb" aria-label="Breadcrumb">
          <Link href="/home" className="pd__breadcrumb-link"><ArrowLeft size={14} /> Auctions</Link>
          <span className="pd__breadcrumb-sep" aria-hidden>/</span>
          <Link href={`/home?category=${encodeURIComponent(detail.category)}`} className="pd__breadcrumb-link">{detail.category}</Link>
          <span className="pd__breadcrumb-sep" aria-hidden>/</span>
          <span className="pd__breadcrumb-current" title={detail.title}>{detail.title}</span>
        </nav>

        {/* Moderation banners */}
        {isPending && (
          <div className="pd__status-banner pd__status-banner--pending" role="status">
            <AlertTriangle size={16} />
            This listing is awaiting admin approval and is not yet visible on the marketplace.
          </div>
        )}
        {isRejected && (
          <div className="pd__status-banner pd__status-banner--rejected" role="alert">
            <AlertTriangle size={16} />
            This listing was rejected by an administrator and cannot accept bids.
          </div>
        )}

        <div className="pd__grid">
          {/* ════════════════ LEFT COLUMN ════════════════ */}
          <div className="pd__col pd__col--main">

            {/* ── Image gallery ── */}
            <div className="pd__gallery">
              <div
                className="pd__gallery-main"
                onClick={() => setImageZoomed(true)}
                role="button"
                tabIndex={0}
                aria-label="Zoom image"
                onKeyDown={(e) => e.key === 'Enter' && setImageZoomed(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImages[activeImage] ?? detail.image}
                  alt={detail.title}
                  className="pd__gallery-img"
                />

                {detail.featured && (
                  <span className="pd__gallery-badge pd__gallery-badge--featured">
                    <Star size={11} fill="currentColor" aria-hidden /> Featured
                  </span>
                )}
                <span className="pd__gallery-badge pd__gallery-badge--category">
                  <Tag size={10} aria-hidden /> {detail.category}
                </span>

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pd__gallery-arrow pd__gallery-arrow--prev"
                      onClick={(e) => { e.stopPropagation(); setActiveImage((i) => Math.max(0, i - 1)) }}
                      disabled={activeImage === 0}
                      aria-label="Previous image"
                    ><ChevronLeft size={18} /></button>
                    <button
                      type="button"
                      className="pd__gallery-arrow pd__gallery-arrow--next"
                      onClick={(e) => { e.stopPropagation(); setActiveImage((i) => Math.min(galleryImages.length - 1, i + 1)) }}
                      disabled={activeImage === galleryImages.length - 1}
                      aria-label="Next image"
                    ><ChevronRight size={18} /></button>
                    <span className="pd__gallery-counter" aria-label={`Photo ${activeImage + 1} of ${galleryImages.length}`}>
                      {activeImage + 1}/{galleryImages.length}
                    </span>
                  </>
                )}
                <span className="pd__gallery-zoom-hint" aria-hidden>🔍 Click to zoom</span>
              </div>

              {galleryImages.length > 1 && (
                <div className="pd__thumbs" role="list" aria-label="Listing photos">
                  {galleryImages.map((src, i) => (
                    <button
                      key={`${src.slice(0, 24)}-${i}`}
                      type="button"
                      role="listitem"
                      className={i === activeImage ? 'pd__thumb pd__thumb--active' : 'pd__thumb'}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Photo ${i + 1}`}
                      aria-current={i === activeImage ? 'true' : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Item details card ── */}
            <div className="pd__card">
              <h2 className="pd__card-title">Item Details</h2>
              <p className="pd__desc">{detail.description}</p>
              <div className="pd__meta-chips">
                <div className="pd__meta-chip">
                  <Package size={14} aria-hidden />
                  <div>
                    <span className="pd__meta-chip-label">Condition</span>
                    <span className="pd__meta-chip-value">{detail.condition ?? 'Not specified'}</span>
                  </div>
                </div>
                <div className="pd__meta-chip">
                  <Tag size={14} aria-hidden />
                  <div>
                    <span className="pd__meta-chip-label">Category</span>
                    <span className="pd__meta-chip-value">{detail.category}</span>
                  </div>
                </div>
                <div className="pd__meta-chip">
                  <ShieldCheck size={14} aria-hidden />
                  <div>
                    <span className="pd__meta-chip-label">Seller</span>
                    <span className="pd__meta-chip-value">
                      {detail.seller}
                      {detail.sellerVerified && <CheckCircle size={12} style={{ color: 'var(--bz-info)' }} aria-label="Verified" />}
                    </span>
                  </div>
                </div>
                <div className="pd__meta-chip">
                  <Gavel size={14} aria-hidden />
                  <div>
                    <span className="pd__meta-chip-label">Starting Bid</span>
                    <span className="pd__meta-chip-value">{formatMoney(detail.startingBid)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Price history chart ── */}
            <div className="pd__card">
              <div className="pd__ph-header">
                <h2 className="pd__card-title pd__card-title--flush">{t('product.priceHistory')}</h2>
                <div className="pd__ph-ranges" role="tablist" aria-label="Price history range">
                  {PRICE_RANGES.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      role="tab"
                      aria-selected={priceRange === r.key}
                      className={priceRange === r.key ? 'pd__ph-range pd__ph-range--active' : 'pd__ph-range'}
                      onClick={() => setPriceRange(r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.stats && (
                <div className="pd__ph-stats">
                  <div className="pd__ph-stat">
                    <span className="pd__ph-stat-label">Change</span>
                    <span className={chartData.stats.delta >= 0 ? 'pd__ph-stat-value pd__ph-stat-value--up' : 'pd__ph-stat-value pd__ph-stat-value--down'}>
                      {chartData.stats.delta >= 0
                        ? <ArrowUpRight size={13} aria-hidden />
                        : <ArrowDownRight size={13} aria-hidden />}
                      {formatMoney(Math.abs(chartData.stats.delta))} ({chartData.stats.pct >= 0 ? '+' : '−'}{Math.abs(chartData.stats.pct).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="pd__ph-stat">
                    <span className="pd__ph-stat-label">High</span>
                    <span className="pd__ph-stat-value">{formatMoney(chartData.stats.high)}</span>
                  </div>
                  <div className="pd__ph-stat">
                    <span className="pd__ph-stat-label">Low</span>
                    <span className="pd__ph-stat-value">{formatMoney(chartData.stats.low)}</span>
                  </div>
                  <div className="pd__ph-stat">
                    <span className="pd__ph-stat-label">Bids</span>
                    <span className="pd__ph-stat-value">{chartData.stats.count}</span>
                  </div>
                </div>
              )}

              {chartData.empty ? (
                <div className="pd__ph-empty">
                  <Clock size={26} aria-hidden />
                  <p>No bids in this period</p>
                  <button type="button" className="pd__ph-empty-btn" onClick={() => setPriceRange('all')}>
                    View full history
                  </button>
                </div>
              ) : (
                <PriceHistoryChart points={chartData.points} />
              )}
            </div>

            {/* ── Bid intelligence ── */}
            <div className="pd__card pd__card--intel">
              <div className="pd__intel-header">
                <h2 className="pd__card-title pd__card-title--flush">Bid Intelligence</h2>
                <span className="pd__intel-badge">
                  <Bot size={12} aria-hidden /> AI powered
                </span>
              </div>

              <div className="pd__intel-grid">
                <div className="pd__intel-gauge">
                  <WinProbabilityGauge percent={winPct} seed={detail.id} />
                  <p className="pd__intel-gauge-sub">
                    Win probability at <strong>{formatMoney(bidAmount)}</strong>
                  </p>
                </div>

                <div className="pd__intel-tiles">
                  <div className="pd__intel-tile pd__intel-tile--suggest">
                    <span className="pd__intel-tile-label">Suggested bid</span>
                    <strong className="pd__intel-tile-value pd__intel-tile-value--gold">{formatMoney(suggest)}</strong>
                    <button
                      type="button"
                      className="pd__intel-use"
                      disabled={!canBid}
                      onClick={() => {
                        setBidAmount(suggest)
                        showToast('info', `Bid amount set to ${formatMoney(suggest)}`)
                      }}
                    >
                      Use this bid
                    </button>
                  </div>
                  <div className="pd__intel-tile">
                    <span className="pd__intel-tile-label">Market reference</span>
                    <strong className="pd__intel-tile-value">{formatMoney(refHigh)}</strong>
                    <span className="pd__intel-tile-hint">Similar {detail.category} lots</span>
                  </div>
                  <div className="pd__intel-tile">
                    <span className="pd__intel-tile-label">Active bidders</span>
                    <strong className="pd__intel-tile-value">
                      <Users size={15} aria-hidden /> {uniqueBidders}
                    </strong>
                    <span className="pd__intel-tile-hint">In this auction</span>
                  </div>
                  <div className="pd__intel-tile">
                    <span className="pd__intel-tile-label">Avg bid step</span>
                    <strong className="pd__intel-tile-value">{avgBidStep > 0 ? formatMoney(avgBidStep) : '—'}</strong>
                    <span className="pd__intel-tile-hint">Between bids</span>
                  </div>
                </div>
              </div>

              <blockquote className="pd__intel-bubble">
                <Bot size={16} aria-hidden />
                <span>
                  Similar <strong>{detail.category}</strong> lots have recently cleared around{' '}
                  <strong>{formatMoney(refHigh)}</strong>. A bid near <strong>{formatMoney(suggest)}</strong> is
                  often competitive. Demo guidance — not financial advice.
                </span>
              </blockquote>
            </div>

          </div>{/* end LEFT */}

          {/* ════════════════ RIGHT COLUMN ════════════════ */}
          <div className="pd__col pd__col--side">

            {/* ── Sticky bid panel ── */}
            <div className="pd__sticky-panel">

              {/* Live/ended badge */}
              <div className={`pd__live-badge ${isEnded ? 'pd__live-badge--ended' : ''}`}>
                {!isEnded && <span className="pd__live-dot" aria-hidden />}
                {isEnded ? 'Auction Ended' : 'Live Auction'}
              </div>

              {/* Title + actions */}
              <div className="pd__title-row">
                <h1 className="pd__title">{detail.title}</h1>
                <div className="pd__icon-actions">
                  <button
                    type="button"
                    className={inWishlist ? 'pd__icon-btn pd__icon-btn--heart' : 'pd__icon-btn'}
                    aria-pressed={inWishlist}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={() => toggle(detail.id)}
                  >
                    <Heart size={19} fill={inWishlist ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className={`pd__icon-btn ${copied ? 'pd__icon-btn--copied' : ''}`}
                    aria-label="Share listing"
                    onClick={handleShare}
                  >
                    {copied ? <CheckCircle size={19} /> : <Share2 size={19} />}
                  </button>
                </div>
              </div>

              {/* Stats strip */}
              <div className="pd__stats-strip">
                <span className="pd__stat">
                  <TrendingUp size={14} aria-hidden />
                  <strong>{(detail.bids ?? 0).toLocaleString()}</strong> bids
                </span>
                <span className="pd__stat">
                  <Eye size={14} aria-hidden />
                  <strong>{(detail.views ?? 0).toLocaleString()}</strong> views
                </span>
                {detail.sellerVerified && (
                  <span className="pd__stat pd__stat--verified">
                    <ShieldCheck size={13} aria-hidden /> Verified Seller
                  </span>
                )}
              </div>

              {/* Price box */}
              <div className="pd__price-box">
                <div className="pd__price-main-row">
                  <span className="pd__price-label">Current Bid</span>
                  <strong className="pd__price-main">{formatMoney(detail.currentBid)}</strong>
                </div>
                {detail.reservePrice != null && detail.reservePrice > 0 && (
                  <div className={`pd__reserve-row ${reserveMet ? 'pd__reserve-row--met' : ''}`}>
                    <span>{reserveMet ? '✓ Reserve price met' : '⚠ Reserve not yet met'}</span>
                    {!reserveMet && <span className="pd__reserve-amt">{formatMoney(detail.reservePrice)}</span>}
                  </div>
                )}
                {detail.buyNow != null && (
                  <div className="pd__buynow-row">
                    <span>Buy Now</span>
                    <strong className="pd__buynow-price">{formatMoney(detail.buyNow)}</strong>
                  </div>
                )}
              </div>

              {/* "You are leading / outbid" status */}
              {isAuthenticated && !isEnded && topBidder && (
                <div className={`pd__bid-status ${userIsLeading ? 'pd__bid-status--leading' : 'pd__bid-status--outbid'}`}>
                  {userIsLeading
                    ? <><Trophy size={14} aria-hidden /> You are the highest bidder!</>
                    : <><AlertTriangle size={14} aria-hidden /> You&apos;ve been outbid — raise your bid</>
                  }
                </div>
              )}

              {/* Countdown */}
              <div
                className={[
                  'pd__countdown',
                  urgentCountdown ? 'pd__countdown--urgent' : '',
                  isEnded ? 'pd__countdown--ended' : '',
                ].filter(Boolean).join(' ')}
              >
                <p className="pd__countdown-label">
                  {isEnded ? 'Auction has ended' : showAntiSnipeBanner ? '⚡ Final stretch!' : 'Time remaining'}
                </p>
                <div className="pd__countdown-digits" aria-live="polite" aria-label="Countdown">
                  {showDays && (
                    <div className="pd__digit-block">
                      <em>{clock.d}</em><small>days</small>
                    </div>
                  )}
                  <div className="pd__digit-block"><em>{clock.h}</em><small>hrs</small></div>
                  <div className="pd__digit-block"><em>{clock.m}</em><small>min</small></div>
                  <div className="pd__digit-block"><em>{clock.s}</em><small>sec</small></div>
                </div>
              </div>

              {/* Anti-sniping notice */}
              {showAntiSnipeBanner && (
                <div className="pd__anti-snipe" role="status">
                  <Lock size={15} aria-hidden />
                  <span>Bids in the last 15 minutes automatically extend the auction by 10 minutes.</span>
                </div>
              )}

              {/* BC wallet row */}
              {isAuthenticated && !isEnded && (
                <div className="pd__wallet-row">
                  <span className="pd__wallet-label">Your BC Balance</span>
                  <div className="pd__wallet-right">
                    <BcCoin size={15} />
                    <strong className="pd__wallet-amount">{(user?.bcBalance ?? 0).toLocaleString()}</strong>
                    <Link href="/coins" className="pd__wallet-topup">Top up →</Link>
                  </div>
                </div>
              )}

              {/* ── Bid section ── */}
              {!isEnded && !isRejected && (
                <>
                  {/* Quick preset amounts */}
                  <div className="pd__quick-bids">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`pd__quick-btn${bidAmount === amt ? ' pd__quick-btn--active' : ''}`}
                        onClick={() => setBidAmount(amt)}
                        title={`Bid ${formatMoney(amt)}`}
                      >
                        {formatMoney(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Bid input */}
                  <div>
                    <label className="pd__bid-label" htmlFor="bid-input">
                      Your Bid <span className="pd__bid-min">(min. {formatMoney(minBid)})</span>
                    </label>
                    <div className="pd__bid-row">
                      <div className="pd__bid-input-wrap">
                        <span className="pd__dollar" aria-hidden>$</span>
                        <input
                          id="bid-input"
                          type="number"
                          min={minBid}
                          step={bidIncrement}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          disabled={!canBid || bidLoading}
                          aria-label={`Bid amount, minimum ${formatMoney(minBid)}`}
                        />
                      </div>
                      <button
                        type="button"
                        className="pd__place-bid"
                        onClick={handlePlaceBid}
                        disabled={!canBid || bidLoading}
                      >
                        {bidLoading
                          ? <><RefreshCw size={15} className="pd__spin" aria-hidden /> Placing…</>
                          : <><Gavel size={15} aria-hidden /> Place Bid</>
                        }
                      </button>
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <p className="pd__sign-in-cta">
                      <Link href="/">Sign in</Link> to place a bid
                    </p>
                  )}

                  {/* Secondary action buttons */}
                  <div className="pd__btns">
                    <button
                      type="button"
                      className={`pd__btn pd__btn--auto${autoBidActive ? ' pd__btn--auto-active' : ''}`}
                      onClick={() => { if (!canBid) return; setAutoModal(true) }}
                      disabled={!canBid}
                      title="Set a maximum and let BidZone bid for you automatically"
                    >
                      <Zap size={15} aria-hidden />
                      {autoBidActive ? `Auto-Bid on (max ${formatMoney(autoBidMax)})` : 'Set Auto-Bid'}
                    </button>

                    {detail.buyNow != null && (
                      <button
                        type="button"
                        className="pd__btn pd__btn--buy"
                        disabled={cartHas || !canBid}
                        onClick={handleBuyNow}
                      >
                        <ShoppingCart size={15} aria-hidden />
                        {cartHas ? 'Added to cart ✓' : `Buy Now — ${formatMoney(detail.buyNow)}`}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Ended state */}
              {isEnded && (
                <div className="pd__ended-notice">
                  <Trophy size={22} aria-hidden />
                  <div>
                    <p className="pd__ended-title">Auction has ended</p>
                    {topBidder
                      ? <p className="pd__ended-winner">Won by <strong>{topBidder.user}</strong> with {formatMoney(topBidder.amount)}</p>
                      : <p className="pd__ended-winner">No bids were placed</p>
                    }
                  </div>
                </div>
              )}

              {/* Trust badge */}
              <div className="pd__trust-row">
                <ShieldCheck size={14} aria-hidden />
                <span>Buyer protection on every BidZone purchase</span>
              </div>

            </div>{/* end sticky panel */}

            {/* ── Bid history card ── */}
            <div className="pd__card">
              <div className="pd__bh-header">
                <h2 className="pd__card-title" style={{ margin: 0 }}>Bid History</h2>
                <div className="pd__bh-meta">
                  <span className="pd__bh-count">{displayedBids.length} bids</span>
                  <button
                    type="button"
                    className="pd__bh-refresh"
                    onClick={() => void fetchBids()}
                    aria-label="Refresh bid history"
                    title="Refresh"
                  >
                    <RefreshCw size={13} className={bidsLoading ? 'pd__spin' : ''} aria-hidden />
                  </button>
                </div>
              </div>

              {displayedBids.length === 0 ? (
                <div className="pd__bh-empty">
                  <Gavel size={28} aria-hidden />
                  <p>No bids yet — be the first to bid!</p>
                </div>
              ) : (
                <ul className="pd__bh-list">
                  {displayedBids.map((row, idx) => (
                    <li key={row.id} className={`pd__bh-item${idx === 0 ? ' pd__bh-item--top' : ''}`}>
                      <div
                        className="pd__bh-avatar"
                        style={{ background: avatarColor(row.user) }}
                        aria-hidden
                      >
                        {initials(row.user)}
                      </div>
                      <div className="pd__bh-info">
                        <strong className="pd__bh-name">
                          {row.user}
                          {idx === 0 && <span className="pd__bh-leading-tag">Leading</span>}
                        </strong>
                        <span className="pd__bh-time">{row.time}</span>
                      </div>
                      <span className="pd__bh-amt">{formatMoney(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>{/* end RIGHT */}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
