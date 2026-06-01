'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Gavel, Heart, ShoppingCart } from 'lucide-react'
import type { AuctionItem } from '@/data/auctions'
import { formatTimeLeftCompact, secondsUntil } from '@/lib/auctionTime'
import { useI18n } from '@/context/I18nContext'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type Props = { item: AuctionItem }

export function AuctionCard({ item }: Props) {
  const { t } = useI18n()
  const { has, toggle } = useWishlist()
  const { has: cartHas, add: addToCart } = useCart()
  const saved = has(item.id)
  const inCart = cartHas(item.id)

  const [ticker, setTicker] = useState(0)
  useEffect(() => {
    if (!item.auctionEndsAt) return
    const id = window.setInterval(() => setTicker((n) => n + 1), 30000)
    return () => window.clearInterval(id)
  }, [item.auctionEndsAt])

  const endsLabel = useMemo(() => {
    if (!item.auctionEndsAt) return item.timeLeft
    if (secondsUntil(item.auctionEndsAt) <= 0) return t('auction.ended')
    return formatTimeLeftCompact(item.auctionEndsAt)
  }, [item.auctionEndsAt, item.timeLeft, t, ticker])

  return (
    <article className="auction-card">
      <Link href={`/listing/${item.id}`} className="auction-card__overlay">
        <span className="auction-card__visually-hidden">{item.title}</span>
      </Link>
      <div className="auction-card__image-wrap">
        <img src={item.image} alt="" className="auction-card__image" loading="lazy" />
        {item.featured && (
          <span className="auction-card__badge auction-card__badge--featured">
            <span aria-hidden>★</span> {t('card.featured')}
          </span>
        )}
        <span className="auction-card__badge auction-card__badge--category">{item.category}</span>
        <button
          type="button"
          className={saved ? 'auction-card__wishlist auction-card__wishlist--active' : 'auction-card__wishlist'}
          aria-pressed={saved}
          aria-label={saved ? t('wishlist.remove') : t('wishlist.add')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id) }}
        >
          <Heart size={20} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        {item.buyNow != null && (
          <button
            type="button"
            className={inCart ? 'auction-card__cart auction-card__cart--active' : 'auction-card__cart'}
            aria-pressed={inCart}
            aria-label={inCart ? t('cart.inCart') : t('cart.add')}
            disabled={inCart}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item.id) }}
          >
            <ShoppingCart size={20} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="auction-card__body">
        <h3 className="auction-card__title">{item.title}</h3>
        <div className="auction-card__prices">
          <p className="auction-card__row">
            <span className="auction-card__label">{t('card.currentBid')}</span>{' '}
            <span className="auction-card__bid">{formatMoney(item.currentBid)}</span>
          </p>
          {item.buyNow != null && (
            <p className="auction-card__row">
              <span className="auction-card__label">{t('card.buyNow')}</span>{' '}
              <span className="auction-card__buy">{formatMoney(item.buyNow)}</span>
            </p>
          )}
        </div>
        <div className="auction-card__cta-wrap">
          <Link href={`/listing/${item.id}`} className="auction-card__enter">
            {t('card.enterAuction')}
          </Link>
        </div>
        <div className="auction-card__footer">
          <span className="auction-card__meta">
            <Gavel size={16} aria-hidden />
            {item.bids} {t('card.bids')}
          </span>
          <span className={item.urgent ? 'auction-card__meta auction-card__meta--urgent' : 'auction-card__meta'}>
            <Clock size={16} aria-hidden />
            {endsLabel}
          </span>
        </div>
      </div>
    </article>
  )
}
