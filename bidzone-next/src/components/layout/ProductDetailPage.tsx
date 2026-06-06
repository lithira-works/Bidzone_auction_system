'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Eye, Gavel, Heart, Share2, ShoppingCart, ShieldCheck, TrendingUp, Zap, CheckCircle, Lock,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PriceHistoryChart } from '@/components/ui/PriceHistoryChart'
import { WinProbabilityGauge } from '@/components/ui/WinProbabilityGauge'
import { BidCoachPanel } from '@/components/ui/BidCoachPanel'
import { getAuctionDetail } from '@/data/auctionDetails'
import type { AuctionItem } from '@/data/auctions'
import { secondsUntil } from '@/lib/auctionTime'
import { estimateWinProbability } from '@/lib/winProbability'
import { useListings } from '@/context/ListingsContext'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useI18n } from '@/context/I18nContext'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function toSeconds(t: { h: number; m: number; s: number }) {
  return Math.max(0, t.h * 3600 + t.m * 60 + t.s)
}

function formatHMS(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

const ANTI_SNIPING_WINDOW_SEC = 15 * 60

export function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { mergedCatalog, placeBid, fetchListingById } = useListings()
  const { has, toggle } = useWishlist()
  const { has: cartHasItem, add: addToCart } = useCart()
  const { addBidPlaced, addLotBroadcast } = useNotifications()
  const { t } = useI18n()
  const [extraItem, setExtraItem] = useState<AuctionItem | null>(null)

  useEffect(() => {
    if (!id) return
    if (mergedCatalog.some((a) => a.id === id)) {
      setExtraItem(null)
      return
    }
    void fetchListingById(id).then((item) => setExtraItem(item))
  }, [id, mergedCatalog, fetchListingById])

  const catalogForDetail = useMemo(() => {
    if (!extraItem) return mergedCatalog
    if (mergedCatalog.some((a) => a.id === extraItem.id)) return mergedCatalog
    return [...mergedCatalog, extraItem]
  }, [mergedCatalog, extraItem])

  const detail = id ? getAuctionDetail(id, catalogForDetail) : undefined
  const isPending = detail?.moderationStatus === 'pending'
  const isRejected = detail?.moderationStatus === 'rejected'

  const galleryImages = useMemo(() => {
    if (!detail) return []
    return detail.images?.length ? detail.images : [detail.image]
  }, [detail])

  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setActiveImage(0)
  }, [detail?.id])

  const minBid = detail ? detail.currentBid + detail.bidIncrement : 0
  const [bidAmount, setBidAmount] = useState(minBid)
  const inWishlist = detail ? has(detail.id) : false
  const cartHas = detail ? cartHasItem(detail.id) : false

  useEffect(() => {
    if (detail) setBidAmount(detail.currentBid + detail.bidIncrement)
  }, [detail?.id, detail?.currentBid, detail?.bidIncrement])

  const [remainSec, setRemainSec] = useState(() => detail ? toSeconds(detail.countdownInitial) : 0)

  useEffect(() => {
    if (!detail) return
    if (detail.auctionEndsAt) {
      const tick = () => setRemainSec(secondsUntil(detail.auctionEndsAt!))
      tick()
      const idTimer = window.setInterval(tick, 1000)
      return () => window.clearInterval(idTimer)
    }
    setRemainSec(toSeconds(detail.countdownInitial))
    const idTimer = window.setInterval(() => {
      setRemainSec((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => window.clearInterval(idTimer)
  }, [detail])

  const clock = useMemo(() => formatHMS(remainSec), [remainSec])

  const showAntiSnipingBanner = useMemo(() => {
    if (!detail?.auctionEndsAt) return false
    return remainSec > 0 && remainSec <= ANTI_SNIPING_WINDOW_SEC
  }, [detail?.auctionEndsAt, remainSec])

  const winPct = useMemo(() => {
    if (!detail) return 48
    return estimateWinProbability({ yourBid: bidAmount, minBid, urgencySec: remainSec })
  }, [detail, bidAmount, minBid, remainSec])

  const handleShare = useCallback(async () => {
    if (!detail) return
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: detail.title, url })
      else await navigator.clipboard.writeText(url)
    } catch { /* ignore */ }
  }, [detail])

  const handlePlaceBid = useCallback(async () => {
    if (!detail || isPending || isRejected) return
    if (!Number.isFinite(bidAmount) || bidAmount < minBid) {
      window.alert(t('product.bidRejected'))
      return
    }
    const ok = await placeBid({
      auctionId: detail.id,
      amount: bidAmount,
      minBid,
      seedBidHistory: detail.bidHistory.map((row) => ({ id: row.id, user: row.user, time: row.time, amount: row.amount })),
    })
    if (!ok) { window.alert(t('product.bidRejected')); return }
    addBidPlaced(bidAmount, detail.title)
    addLotBroadcast(detail.title, bidAmount)
  }, [detail, bidAmount, minBid, placeBid, addBidPlaced, addLotBroadcast, t, isPending, isRejected])

  const handleBuyNow = useCallback(() => {
    if (!detail || detail.buyNow == null) return
    addToCart(detail.id)
  }, [detail, addToCart])

  useEffect(() => {
    if (!id || !detail) router.replace('/home')
  }, [id, detail, router])

  if (!id || !detail) return null

  return (
    <div className="product-detail">
      <SiteHeader />
      <div className="product-detail__wrap">
        <Link href="/home" className="product-detail__back">
          <ArrowLeft size={18} aria-hidden />
          {t('product.back')}
        </Link>

        {(isPending || isRejected) && (
          <div className="product-detail__moderation-banner" role="status">
            {isPending
              ? 'This listing is awaiting admin approval and is not visible on the marketplace yet.'
              : 'This listing was rejected by an administrator.'}
          </div>
        )}

        <div className="product-detail__grid">
          <div className="product-detail__col product-detail__col--main">
            <div className="product-detail__image-card">
              <img
                src={galleryImages[activeImage] ?? detail.image}
                alt={detail.title}
                className="product-detail__image"
              />
              {galleryImages.length > 1 && (
                <div className="product-detail__thumbs" role="list" aria-label="Listing photos">
                  {galleryImages.map((src, i) => (
                    <button
                      key={`${src.slice(0, 24)}-${i}`}
                      type="button"
                      role="listitem"
                      className={i === activeImage ? 'product-detail__thumb product-detail__thumb--active' : 'product-detail__thumb'}
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

            <section className="product-detail__card">
              <h2 className="product-detail__card-title">{t('product.description')}</h2>
              <p className="product-detail__desc">{detail.description}</p>
              <dl className="product-detail__meta-grid">
                <div><dt>{t('product.condition')}</dt><dd>{detail.condition}</dd></div>
                <div><dt>{t('product.category')}</dt><dd>{detail.category}</dd></div>
                <div>
                  <dt>{t('product.seller')}</dt>
                  <dd>
                    <span className={detail.sellerVerified ? 'product-detail__seller product-detail__seller--verified' : 'product-detail__seller'}>
                      {detail.seller}
                      {detail.sellerVerified && (
                        <CheckCircle className="product-detail__verified" size={16} aria-label={t('product.verifiedSeller')} />
                      )}
                    </span>
                  </dd>
                </div>
                <div><dt>{t('product.startingBid')}</dt><dd>{formatMoney(detail.startingBid)}</dd></div>
              </dl>
            </section>

            <section className="product-detail__card">
              <h2 className="product-detail__card-title">{t('product.priceHistory')}</h2>
              <PriceHistoryChart points={detail.priceHistory} />
            </section>
          </div>

          <div className="product-detail__col product-detail__col--side">
            <div className="product-detail__card product-detail__card--sticky">
              <p className="product-detail__live-room">{t('product.auctionRoom')}</p>
              <div className="product-detail__title-row">
                <h1 className="product-detail__title">{detail.title}</h1>
                <div className="product-detail__icon-actions">
                  <button
                    type="button"
                    className={inWishlist ? 'product-detail__icon-btn product-detail__icon-btn--active' : 'product-detail__icon-btn'}
                    aria-pressed={inWishlist}
                    aria-label={inWishlist ? t('wishlist.remove') : t('wishlist.add')}
                    onClick={() => detail && toggle(detail.id)}
                  >
                    <Heart size={22} fill={inWishlist ? 'currentColor' : 'none'} />
                  </button>
                  <button type="button" className="product-detail__icon-btn" aria-label={t('product.share')} onClick={handleShare}>
                    <Share2 size={22} />
                  </button>
                </div>
              </div>

              <div className="product-detail__stats">
                <span><TrendingUp size={18} aria-hidden />{detail.bids} {t('product.bids')}</span>
                <span><Eye size={18} aria-hidden />{detail.views.toLocaleString()} {t('product.views')}</span>
              </div>

              <div className="product-detail__price-box">
                <div className="product-detail__price-row">
                  <span>{t('product.currentBid')}</span>
                  <strong className="product-detail__price-current">{formatMoney(detail.currentBid)}</strong>
                </div>
                {detail.reservePrice != null && detail.reservePrice > 0 && (
                  <div className="product-detail__price-row product-detail__price-row--secondary">
                    <span>{t('product.reservePrice')}</span>
                    <strong className="product-detail__price-reserve">{formatMoney(detail.reservePrice)}</strong>
                  </div>
                )}
                {detail.buyNow != null && (
                  <div className="product-detail__price-row product-detail__price-row--secondary">
                    <span>{t('product.buyNowPrice')}</span>
                    <strong className="product-detail__price-buy">{formatMoney(detail.buyNow)}</strong>
                  </div>
                )}
              </div>

              <div className="product-detail__countdown">
                <p className="product-detail__countdown-label">{t('product.timeLeft')}</p>
                <div className="product-detail__countdown-digits" aria-live="polite">
                  <span><em>{clock.h}</em><small>{t('product.hours')}</small></span>
                  <span><em>{clock.m}</em><small>{t('product.mins')}</small></span>
                  <span><em>{clock.s}</em><small>{t('product.secs')}</small></span>
                </div>
              </div>

              {showAntiSnipingBanner && (
                <div className="product-detail__anti-sniping" role="status">
                  <Lock size={22} className="product-detail__anti-sniping-icon" aria-hidden />
                  <div>
                    <p className="product-detail__anti-sniping-title">{t('product.antiSnipingTitle')}</p>
                    <p className="product-detail__anti-sniping-body">{t('product.antiSnipingBody')}</p>
                  </div>
                </div>
              )}

              <section className="product-detail__win-block" aria-labelledby="win-prob-heading">
                <h2 id="win-prob-heading" className="product-detail__win-heading">{t('product.winProbTitle')}</h2>
                <WinProbabilityGauge percent={winPct} seed={detail.id} />
                <p className="product-detail__win-sub">{t('product.winProbSub')}</p>
              </section>

              <BidCoachPanel category={detail.category} currentHigh={detail.currentBid} minBid={minBid} />

              <label className="product-detail__bid-label" htmlFor="bid-input">
                {t('product.yourBid', { min: formatMoney(minBid) })}
              </label>
              <div className="product-detail__bid-row">
                <div className="product-detail__bid-input-wrap">
                  <span className="product-detail__dollar">$</span>
                  <input
                    id="bid-input"
                    type="number"
                    min={minBid}
                    step={detail.bidIncrement}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                  />
                </div>
                <button
                  type="button"
                  className="product-detail__place-bid"
                  onClick={handlePlaceBid}
                  disabled={isPending || isRejected}
                >
                  <Gavel size={18} aria-hidden />
                  {t('product.placeBid')}
                </button>
              </div>

              <button type="button" className="product-detail__btn product-detail__btn--auto">
                <Zap size={18} aria-hidden />
                {t('product.autoBid')}
              </button>
              {detail.buyNow != null && (
                <button
                  type="button"
                  className="product-detail__btn product-detail__btn--buy"
                  disabled={cartHas || isPending || isRejected}
                  onClick={handleBuyNow}
                >
                  <ShoppingCart size={18} aria-hidden />
                  {cartHas ? t('cart.inCart') : t('product.buyNowBtn', { price: formatMoney(detail.buyNow) })}
                </button>
              )}

              <p className="product-detail__trust">
                <ShieldCheck size={18} aria-hidden />
                {t('product.buyerProtection')}
              </p>
            </div>

            <section className="product-detail__card">
              <h2 className="product-detail__card-title">{t('product.bidHistory')}</h2>
              <ul className="product-detail__bid-list">
                {detail.bidHistory.map((row) => (
                  <li key={row.id} className="product-detail__bid-item">
                    <span className="product-detail__bid-avatar" aria-hidden />
                    <div className="product-detail__bid-info">
                      <strong>{row.user}</strong>
                      <span>{row.time}</span>
                    </div>
                    <span className="product-detail__bid-amt">{formatMoney(row.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
